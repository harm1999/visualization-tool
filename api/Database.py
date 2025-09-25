from collections import defaultdict, Counter
import json

aggregate_classes = False

class Database:

    def __init__(self, sql_instance):
        self.edges = defaultdict(list)
        self.sql_instance = sql_instance
        self.llm_instance = False

    def inject_trace(self, root, filename):
        
        self.sql_instance.delete([{
            "type": "equals",
            "column": "testname",
            "value": filename
        }], "trace_nodes")

        cviz2id = {}

        result = self.sql_instance.query([], 'nodes', 'all') + self.sql_instance.query([], 'functions', 'all')
        for node in result:
            cviz2id[node['node']['cvizId']] = node['node']['id']

        records = {"nodes": [], "edges": []}



        def extract_tree_info(node, caller=-1):
            recursiveEntrypoint = False
            i = 0
            childless = True
            new_id = node.attrib['id']

            for child in node:
                i += 1

                if aggregate_classes and child.attrib['class'] == node.attrib['class']:
                    
                    recursiveEntrypoint = True
                else:
                    childless = False

                child_childless = extract_tree_info(child, new_id)
                childless &= child_childless
            
            records['nodes'].append({
                "testname": filename, 
                "id": new_id, 
                "nodeid": cviz2id.get(node.attrib['class'], -1),
                "functionid": cviz2id.get(node.attrib['cvizId'], -1),
                "time": node.attrib['time'],
                "starttime": node.attrib.get('startTime', -1),
                "caller": caller,
                "cvizClass": node.attrib.get('class', None),
                "cvizFunction": node.attrib.get('cvizId', None),
                "status": {
                    "recursiveEntrypoint": recursiveEntrypoint,
                    "fanOut": i >= 4,
                    "childless": childless
                }
            })
            return childless

        extract_tree_info(root)
        print("adding records")
        self.sql_instance.add_records(
            records['nodes'],
            'trace_nodes'
        )


    def inject(self, data):
        cvizId2id = {}
        id2node = {}
        
        functions = {}
        for i, node in enumerate(data['elements']['nodes']):
            cvizId2id[node['data']['id']] = i
            node['data']['cvizId'] = node['data']['id']
            if "Container" in node['data']['labels'] or "Structure" in node['data']['labels']:
                id2node[i] = {**node['data'], "id": i}                
            elif "Operation" in node['data']['labels'] or "Constructor" in node['data']['labels']:
                functions[i] = {**node['data'], "id": i} 

        self.parent = {}
        hasScript = {}
        self.edges = defaultdict(list)
        for edge in data['elements']['edges']:
            idSource = cvizId2id.get(edge['data']['source'], False)
            idTarget = cvizId2id.get(edge['data']['target'], False)
            if id2node.get(idSource, False) and id2node.get(idTarget, False):
                self.edges[edge['data']['label']].append(
                    [
                        idSource, 
                        idTarget
                    ]
                )
                if idTarget == False:
                    raise Exception(f"ISSUE FOR {edge}")
            if edge['data']['label'] == "hasScript":
                
                hasScript[edge['data']['target']] = edge['data']['source']
                # print(edge['data']['target'])
                functions[cvizId2id[edge['data']['target']]]['parent'] = cvizId2id[edge['data']['source']]
        
        sources = [key for key, value in Counter([item[0] for item in self.edges['contains']]).items() 
                if value == 1]

        source2targets = defaultdict(list)
        for key, value in self.edges['contains']:
            source2targets[key].append(value)

        for i in range(len(sources)):
            source = sources[i]

            if id2node[source]['properties']['kind'] == "vcxproj":
                continue

            target = source2targets[source]

            if len(target) > 1:
                raise Exception("Too many hits")

            if len(source2targets[target[0]]) > 0:
                children = source2targets[target[0]]
                source2targets[source] = children

                source2targets.pop(target[0])
                id2node.pop(target[0])

                sources = [item if item != target[0] else source for item in sources]
            else:
                for src, targets in source2targets.items():
                    source2targets[src] = [item if item != source else target[0] for item in targets]

                target = source2targets.pop(source)
                for src, targets in source2targets.items():
                    if source in targets:
                        source2targets[src] += target


                id2node.pop(source)

        self.edges['contains'] = [[source, target] for source in source2targets for target in source2targets[source]]

        self.sql_instance.add_records(
            [
                {"etype": etype, "source": source, "target": target } 
                for etype, item in self.edges.items() for [source, target] in item
            ], 
            "edges")
        
        self.sql_instance.add_records(
            [
                {"id": ID, "node": props, "name": props['properties']['qualifiedName'],"lowername": props['properties']['qualifiedName'].lower()}
                 for ID, props in id2node.items()
            ],
            'nodes'
        )

        self.sql_instance.add_records(
            [
                {"id": ID, "node": props, "name": props['properties']['qualifiedName'], "parent": props['parent']}
                 for ID, props in functions.items()
            ],
            'functions'
        )

        return data

    def check_string(self, string):
        dic = Counter(string.strip().lower().split(" "))

        result = self.sql_instance.query(
            [{
                "type": "string_count_geq",
                "column": "lowername",
                "string": key,
                "value": value
            } for key, value in dic.items() if len(key) > 0], 
            'nodes', 'all')
        
        return result


    def get_projects(self):
        result = self.sql_instance.query([{
            "type": "in",
            "column": "etype",
            "values": ["hasScript", "contains"]
        }], "edges", distinct_cols=["target"])



        result = self.sql_instance.query([{
            "type": "not_in",
            "column": "id",
            "values": [item[0] for item in result]
        }], "nodes", "all")


        return result
        

    def get_node(self, node_id):
        node_id = int(node_id)

        nodes = self.sql_instance.query(
            [{
                "type": "equals",
                "column": "id",
                "value": node_id
            }], 'nodes', 'first'
        )
        edges = []
        
        edge_type, contains = self.get_parent(node_id)
        
        while edge_type is not None:

            source = contains[0]
            
            nodes += self.sql_instance.query(
                [{
                    "type": "equals",
                    "column": "id",
                    "value": source
                }], 'nodes', 'all'
            )

            edges.append({ "id": f"{source}-contains-{node_id}", "source": source, "target": node_id, "type": edge_type })

            node_id = source
            edge_type, contains = self.get_parent(node_id)
        
        # Get functions
        functions = self.sql_instance.query(
            [{
                "type": "in",
                "column": "parent",
                "values": [node['id'] for node in nodes]
            }], 'functions', 'all'
        )
        
        par2func = defaultdict(list)
        for item in functions:
            par2func[item['parent']].append(item['node'])

        for node in nodes:
            node['node']['functions'] = par2func[node['id']]

        return nodes, edges

    def get_nodes(self, nodes):
        nodes = self.sql_instance.query(
            [{
                "type": "in",
                "column": "id",
                "values": nodes
            }], 'nodes', 'all'
        )

        functions = self.sql_instance.query(
            [{
                "type": "in",
                "column": "parent",
                "values": [node['id'] for node in nodes]
            }], 'functions', 'all'
        )
        
        par2func = defaultdict(list)
        for item in functions:
            par2func[item['parent']].append(item['node'])

        for node in nodes:
            node['node']['functions'] = par2func[node['id']]
            
        return nodes


    def get_parent(self, node_id):
        result = self.sql_instance.query(
            [{
                "type": "equals",
                "column": "target",
                "value": node_id
            },
            {
                "type": "in",
                "column": "etype", 
                "values": ["contains", "hasScript"]
            }], 
            'edges', 'first')
        
        return (None, None) if len(result) == 0 else (result[0]['etype'], [result[0]['source'], result[0]['target']])

    def get_descendants(self, node_id):
        node_id = int(node_id)

        nodes   = []
        edges   = []

        new_edges = self.sql_instance.query(
            [{
                "type": "in",
                "column": "etype",
                "values": ["contains", "hasScript"]
            },
            {
                "type": "equals",
                "column": "source",
                "value": node_id
            }],
            'edges', 'all')
        
        while new_edges:
            edges += new_edges
            new_nodes = [item['target'] for item in new_edges]

            nodes += new_nodes

            new_edges = self.sql_instance.query(
                [{
                    "type": "in",
                    "column": "etype",
                    "values": ["contains", "hasScript"]
                },
                {
                    "type": "in",
                    "column": "source",
                    "values": new_nodes
                }],
                'edges', 'all')
            
        edges = [{
            "id": f"{edge['source']}-{edge['etype']}-{edge['target']}",
            "source": edge['source'],
            "target": edge['target'],
            "type":   edge['etype'] 
        } for edge in edges]

        nodes = self.sql_instance.query(
            [{
                "type": "in",
                "column": "id",
                "values": nodes
            }], 'nodes', 'all'
        )

        functions = self.sql_instance.query(
            [{
                "type": "in",
                "column": "parent",
                "values": [node['id'] for node in nodes]
            }], 'functions', 'all'
        )
        
        par2func = defaultdict(list)
        for item in functions:
            par2func[item['parent']].append(item['node'])

        for node in nodes:
            node['node']['functions'] = par2func[node['id']]

        return nodes, edges
    
    def get_children(self, node_id):
        node_id = int(node_id)
        nodes = []
        edges = []


        result = self.sql_instance.query(
            [{
                "type": "equals",
                "column": "source",
                "value": node_id
            },
            {
                "type": "equals",
                "column": "etype",
                "value": "contains"
            }],
            'edges', 'all')
        for item in result:
            src, etype, tgt = item["source"], item["etype"], item["target"]

            nodes += self.sql_instance.query(
                [{
                    "type": "equals",
                    "column": "id",
                    "value": tgt
                }], 'nodes', 'all'
            )

            edges.append({
                "id":     f"{src}-{etype}-{tgt}",
                "source": src,
                "target": tgt,
                "type":   etype
            })
        functions = self.sql_instance.query(
            [{
                "type": "in",
                "column": "parent",
                "values": [node['id'] for node in nodes]
            }], 'functions', 'all'
        )
        
        par2func = defaultdict(list)
        for item in functions:
            par2func[item['parent']].append(item['node'])

        for node in nodes:
            node['node']['functions'] = par2func[node['id']]
        return nodes, edges
    

    def get_surroundings(self, node_id, exclude):
        node_id = int(node_id)
        descendant_nodes, _ = self.get_descendants(node_id)

        descendant_nodes += self.sql_instance.query(
            [{
                "type": "equals",
                "column": "id",
                "value": node_id
            }], 'nodes', 'all'
        )
        
        descendant_nodes = set(map(lambda x: x['id'], descendant_nodes))
        new_edges = set()
        new_node_ids = set()

        records = self.sql_instance.query(
            [{
                "type": "not_in",
                "column": "etype",
                "values": {"contains", "hasScript", "dependsOn"}.union(set(exclude))
            },
            {
                "type": "in",
                "column": ["source", "target"],
                "values": descendant_nodes
            }], 'edges', 'all'
        )

        for item in records:
            edge = [item["source"], item["target"]]
            source = edge[0] in descendant_nodes
            target = edge[1] in descendant_nodes
            if source or target:
                if source:
                    source_node = node_id
                else:
                    source_node = edge[0]
                    new_node_ids.add(source_node)
                
                if target:
                    target_node = node_id
                else:
                    target_node = edge[1]
                    new_node_ids.add(target_node)
                
                new_edges.add((source_node, target_node, item["etype"]))

        new_edges = [{
                        "id":     f"{x[0]}-{x[2]}-{x[1]}",
                        "source": x[0],
                        "target": x[1],
                        "type":   x[2]
                    } for x in new_edges]
        new_nodes = []
        for node_id in new_node_ids:
            nodes, edges = self.get_node(node_id)
            new_nodes += nodes
            new_edges += edges
        return new_nodes, new_edges

    def get_edges(self, items, selfEdges):
        id2ancestor = {}
        for node in items:
            node = int(node)
            id2ancestor.update({id: node for id in [node['id'] for node in self.get_descendants(node)[0]]})
            id2ancestor[node] = node

        records = self.sql_instance.query(
            [{
                "type": "not_in",
                "column": "etype",
                "values": {"contains", "hasScript", "dependsOn"}
            },
            {
                "type": "in",
                "column": "source",
                "values": list(id2ancestor.keys())
            },
            {
                "type": "in",
                "column": "target",
                "values": list(id2ancestor.keys())
            }] + ([{
                "type": "neq_column",
                "column": "source",
                "value": "target"
            }] if not selfEdges else []), 'edges', 'all'
        )        

        return [{
            "id":     f"{id2ancestor[item["source"]]}-{item["etype"]}-{id2ancestor[item["target"]]}",
            "source": id2ancestor[item["source"]],
            "target": id2ancestor[item["target"]],
            "type":   item["etype"]
        } for item in records if id2ancestor[item["source"]] != id2ancestor[item["target"]] or selfEdges]
    
    def get_edge_types(self):
        records = self.sql_instance.query(
            [], 'edges', 'all', distinct_cols=["etype"]
        )
        return list({item[0] for item in records} - {"contains", "hasScript", "dependsOn"})
    
    def get_recommended_nodes(self, currentnodes=[], exclude=[]):
        if len(currentnodes) == 0:

            all_targets = [item[0] for item in self.sql_instance.query([], "edges", distinct_cols=["target"])]
            # print(all_targets)
            all_roots = [item[0] for item in self.sql_instance.query([{
                "type": "not_in",
                "column": "source",
                "values": all_targets
            }], "edges", distinct_cols=["source"])]

            sums = [len(self.get_descendants(root)[0]) for root in all_roots]

            top3_pairs = sorted(zip(sums, all_roots), key=lambda x: x[0], reverse=True)[:3]
            result = [nodes for _, nodes in top3_pairs]

            return self.sql_instance.query([{
                "type": "in",
                "column": "id",
                "values": result
            }], 'nodes')
        else: 
            return []

    def get_traces(self):
        return [item[0] for item in self.sql_instance.query([], "trace_nodes", distinct_cols=["testname"])]


    def get_trace_edges(self, items, trace):
        id2ancestor = {}
        for node in items:
            node = int(node)
            id2ancestor.update({id: node for id in [node['id'] for node in self.get_descendants(node)[0]]})
            id2ancestor[node] = node
        

        records = self.sql_instance.query(
            [
                {
                    "type": "in",
                    "column": "nodeid",
                    "values": list(id2ancestor.keys())
                },
                {
                    "type": "equals",
                    "column": "testname",
                    "value": trace
                }
            ], 'trace_nodes', 'all'
        )

        mapping = {(item['nodeid'], item['caller']) for item in records }


        parentId = self.sql_instance.query(
            [
                {
                    "type": "in",
                    "column": "id",
                    "values": [item[1] for item in mapping]
                },
                {
                    "type": "equals",
                    "column": "testname",
                    "value": trace
                }
            ], 'trace_nodes', 'all', ['id', 'nodeid']
        )
        parentId = {item[0]: item[1] for item in parentId}
        
        mapping = {(item[0], parentId[item[1]], item[1]) for item in mapping if item[1] != -1 and parentId[item[1]] in id2ancestor}

        return [{
            "id":     f"{id2ancestor[item[1]]}-trace-{id2ancestor[item[0]]}",
            "source": id2ancestor[item[1]],
            "target": id2ancestor[item[0]],
            "order": item[2],
            "type":   "trace"
        } for item in mapping if id2ancestor[item[0]] != id2ancestor[item[1]]]
    
    def get_tree_root(self, trace):
        return self.sql_instance.query(
            [
                {
                    "type": "equals",
                    "column": "caller",
                    "value": -1
                },
                {
                    "type": "equals",
                    "column": "testname",
                    "value": trace
                }
            ], 'trace_nodes', 'first'
        )

    def get_trace_surroundings(self, node, trace):
        descendants = [node] + list(map(lambda x: x['id'], self.get_descendants(node)[0]))

        # All leafs
        all_leafs = self.sql_instance.query(
            [{
                "type": "in",
                "column": "nodeid",
                "values": descendants
            }], 'trace_nodes', 'all'
        )

        # classes = [leaf for leaf in all_leafs]

        # Node it calls
        callees = {item['nodeid'] for item in self.sql_instance.query(
            [{
                "type": "in",
                "column": "caller",
                "values": [leaf["id"] for leaf in all_leafs]
            },
            {
                "type": "not_in",
                "column": "cvizClass",
                "values": [leaf['cvizClass'] for leaf in all_leafs]
            }], 'trace_nodes', 'all'
        )}

        callers = {item['nodeid'] for item in self.sql_instance.query(
            [{
                "type": "in",
                "column": "id",
                "values": [leaf["caller"] for leaf in all_leafs]
            },
            {
                "type": "not_in",
                "column": "cvizClass",
                "values": [leaf['cvizClass'] for leaf in all_leafs]
            }], 'trace_nodes', 'all'
        )}

        new_nodes, new_edges = [], []
        
        
        for node_id in callees | callers:
            nodes, edges = self.get_node(node_id)
            new_nodes += nodes
            new_edges += edges

        return new_nodes, new_edges

    def get_tree_children(self, requestNode, trace):
        if not aggregate_classes:
            records = self.sql_instance.query(
                [
                    {
                        "type": "equals",
                        "column": "caller",
                        "value": requestNode
                    },
                    {
                        "type": "equals",
                        "column": "testname",
                        "value": trace
                    }
                ], 'trace_nodes', 'all'
            ) + self.sql_instance.query(
                [
                    {
                        "type": "equals",
                        "column": "id",
                        "value": requestNode
                    },
                    {
                        "type": "equals",
                        "column": "testname",
                        "value": trace
                    }
                ], 'trace_nodes', 'all'
            )

            return records
        else:
            node = self.sql_instance.query(
                [
                    {
                        "type": "equals",
                        "column": "id",
                        "value": requestNode
                    },
                    {
                        "type": "equals",
                        "column": "testname",
                        "value": trace
                    }
                ], 'trace_nodes', 'first'
            )[0]

            requestNodes = [requestNode]

            nodeClass = node['cvizClass']

            toReturn = []

            while len(records := self.sql_instance.query(
                [
                    {
                        "type": "in",
                        "column": "caller",
                        "values": requestNodes
                    },
                    {
                        "type": "equals",
                        "column": "testname",
                        "value": trace
                    }
                ], 'trace_nodes', 'all'
            )):
                
                toReturn += [record for record in records if record['cvizClass'] != nodeClass]
                requestNodes = [record['id'] for record in records if record['cvizClass'] == nodeClass]
                

            return [{**item, "caller": node['id']} for item in toReturn]
    
    # def get_tree_children(self, requestNode, trace):
        
    #     node = self.sql_instance.query(
    #         [
    #             {
    #                 "type": "equals",
    #                 "column": "id",
    #                 "value": requestNode
    #             },
    #             {
    #                 "type": "equals",
    #                 "column": "testname",
    #                 "value": trace
    #             }
    #         ], 'trace_nodes', 'first'
    #     )[0]

    #     requestNodes = [requestNode]

    #     nodeClass = node['cvizClass']

    #     toReturn = []

    #     while len(records := self.sql_instance.query(
    #         [
    #             {
    #                 "type": "in",
    #                 "column": "caller",
    #                 "values": requestNodes
    #             },
    #             {
    #                 "type": "equals",
    #                 "column": "testname",
    #                 "value": trace
    #             }
    #         ], 'trace_nodes', 'all'
    #     )):
            
    #         toReturn += [record for record in records if record['cvizClass'] != nodeClass]
    #         requestNodes = [record['id'] for record in records if record['cvizClass'] == nodeClass]
            

    #     return [{**item, "caller": node['id']} for item in toReturn]
    
    def get_tree_ancestors(self, leaf, trace):
        current = [leaf]
        results = []
        while len(current) > 0:
            result = self.sql_instance.query(
                [
                    {
                        "type": "in",
                        "column": "caller",
                        "values": current
                    },
                    {
                        "type": "equals",
                        "column": "testname",
                        "value": trace
                    }
                ], 'trace_nodes', 'all'
            )

            results += result

            current = [item['id'] for item in result]
            
        return results
    
    # def get_tree_ancestors(self, requestNode, trace):
    #     node = self.sql_instance.query(
    #         [
    #             {
    #                 "type": "equals",
    #                 "column": "id",
    #                 "value": requestNode
    #             },
    #             {
    #                 "type": "equals",
    #                 "column": "testname",
    #                 "value": trace
    #             }
    #         ], 'trace_nodes', 'first'
    #     )[0]

    #     nodeClass = node['cvizClass']

    #     toReturn = []

    #     cursors = {node['id']: [nodeClass, node['id']]}

    #     while len(records := self.sql_instance.query(
    #         [
    #             {
    #                 "type": "in",
    #                 "column": "caller",
    #                 "values": list(cursors.keys())
    #             },
    #             {
    #                 "type": "equals",
    #                 "column": "testname",
    #                 "value": trace
    #             }
    #         ], 'trace_nodes', 'all'
    #     )):
    #         new_cursors = {}

    #         for record in records:
    #             cursor = cursors[record['caller']]
    #             if cursor[0] != record['cvizClass']:
    #                 record['caller'] = cursor[1]
    #                 toReturn.append(record)
    #             new_cursors[record['id']] = [record['cvizClass'], record['id'] if cursor[0] != record['cvizClass'] else cursor[1]]
    #         if len(toReturn) > 1000:
    #             raise Exception("Too many elemenets")

    #         cursors = new_cursors

    #     return toReturn

        # cursors = {}

    def generate_description(self, requestNode, trace):

        result = self.sql_instance.query(
            [
                {
                    "type": "equals",
                    "column": "id",
                    "value": requestNode
                },
                {
                    "type": "equals",
                    "column": "testname",
                    "value": trace
                }
            ], 'trace_nodes', 'first'
        )[0]

        node = {result['id']: result['functionid']}

        parent = {item['id']: item['functionid'] for item in self.sql_instance.query(
            [
                {
                    "type": "equals",
                    "column": "id",
                    "value": result['caller']
                },
                {
                    "type": "equals",
                    "column": "testname",
                    "value": trace
                }
            ], 'trace_nodes', 'first'
        )}

        children = {child['id']: child['functionid'] for child in self.sql_instance.query(
            [
                {
                    "type": "equals",
                    "column": "caller",
                    "value": requestNode
                },
                {
                    "type": "equals",
                    "column": "testname",
                    "value": trace
                }
            ], 'trace_nodes', 'all'
        )}


        funcid2func = {item['id']: item for item in self.sql_instance.query(
            [
                {
                    "type": "in",
                    "column": "id", 
                    "values": list((node | parent | children).values())
                }
            ], 'functions', 'all'
        )}


        # return 

        # node = self.sql_instance.query(
        #     [
        #         {
        #             "type": "equals",
        #             "column": "id",
        #             "value": requestNode
        #         },
        #         {
        #             "type": "equals",
        #             "column": "testname",
        #             "value": trace
        #         }
        #     ], 'trace_nodes', 'first'
        # )[0]

        # requestNodes = [requestNode]

        # nodeClass = node['cvizClass']

        # toReturn = [node]

        # while len(records := self.sql_instance.query(
        #     [
        #         {
        #             "type": "in",
        #             "column": "caller",
        #             "values": requestNodes
        #         },
        #         {
        #             "type": "equals",
        #             "column": "testname",
        #             "value": trace
        #         }
        #     ], 'trace_nodes', 'all'
        # )): 
        #     toReturn += records
        #     requestNodes = [record['id'] for record in records if record['cvizClass'] == nodeClass]

        
        # id2func = {item['id']: item['functionid'] for item in toReturn}

        # result = self.sql_instance.query(
        #     [
        #         {
        #             "type": "in",
        #             "column": "id", 
        #             "values": list(id2func.values())
        #         }
        #     ], 'functions', 'all'
        # )

        # nodes = {node['id']: node for node in result}

        # tree = [[item['caller'], item['id']] for item in toReturn]

        def process_prompt(pr):
            response = self.llm_instance._make_api_call(pr)
            
            return response['choices'][0]['message']['content']

        messages =  [
            {"role": "system", "content": f"""
                You are a software architecture analysis tool. 
            You are going to analyse a part of a trace with the name {trace.replace('.xml', '')}.
            I need you to focus on behaviour and the what its task is within a software system and execution.
            You will describe the task of a function, for which the function is enclosed by the <function> tag. 
            Take into account the functions that the function calls, enclosed by <callee>, and the function that it gets called by, enclosed by <caller>."""}]


        for functionid in node.values():
            node_props = funcid2func[functionid]['node']['properties']
            text = f"Generate a description around the following function. \n<function>The function {node_props['simpleName']}, which works as follows: <worksAs>{node_props['howItWorks']}</worksAs>, \
            and has the following source code: <sourceCode>{node_props.get('sourceText', "None")}</sourceCode></function>\n"

        text += "\n\n"
        for functionid in parent.values():
            parent_props = funcid2func[functionid]['node']['properties']
            text += f"<function/> gets called by: <caller>The function {parent_props['simpleName']}, which works as follows: <worksAs>{parent_props['howItWorks']}</worksAs>, \
            and has the following source code: <sourceCode>{parent_props.get('sourceText', "None")}</sourceCode></caller>\n"

        text += "\n\n"

        for functionid in children.values():
            child_props = funcid2func[functionid]['node']['properties']
            text += f"<function/> calls: <callee>The function {child_props['simpleName']}, which works as follows: <worksAs>{child_props['howItWorks']}</worksAs>, \
            and has the following source code: <sourceCode>{child_props.get('sourceText', "None")}</sourceCode></callee>\n"

        # print(text)


        # root = tree[0][1]
        # def generate_description(node, messages):
        #     node_props = nodes[id2func[node]]['node']['properties']
        #     function_name = node_props['simpleName']

        #     text = f"<function>The function {function_name}, which works as follows: <worksAs>{node_props['description']}</worksAs>, \
        #     and has the following source code: <sourceCode>{node_props.get('sourceText', "None")}</sourceCode></function>\n"
            
        #     children = [item[1] for item in tree if item[0] == node]
        #     print(result)
        #     for child in children:
        #         print(child)

            # if len(children) > 0:
            #     text += "\nThe function calls the following functions:"
            #     for child in children:
            #         child_name, child_text, messages = generate_description(child, messages)
            #         text += f"\n- {child_name}: {child_text}"
            #     text += "\n\nCan you explain what the task is of this traces subtree and can you create a summary?"
            #     messages.append({'role': "user", "content": text})

            #     description = process_prompt({"messages": messages, "temperature":0.5, "seed": 42})
            #     messages.append({'role': "assistant", "content": description})
            # else:
            #     description = text

            # return function_name, description, messages

        # messages += {
        #     "role": "user",
        #     "content": text
        # }
        print(text)
        messages += [{
            "role": "user",
            "content": text
        }]
        print(messages)
        return process_prompt({"messages": messages, "temperature":0.2, "seed": 42})



