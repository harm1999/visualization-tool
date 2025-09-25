import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import cytoscape from "cytoscape";
import { useTreeStore } from "./data/treeStore";
import { useCytoscapeStore } from "./data/store";
import { getTreeRoot, getNodes, getTreeChildren, obtainAncestors } from "./utils/apiHelper";
import { getCytoscapeStyles } from "./styles/treeStyles";
import MainView from "./assets/MainView";
import Toolbar from "./assets/Toolbar";
import SidebarDynamic from "./components/SidebarDynamic";
import { repositionNodes } from "./utils/positioning";
import ButtonsTrace from "./components/ButtonsTrace";
import { LAYOUT, role_stereotype_colors } from "./styles/constants";
import Legend from "./assets/Legend"

const DynamicView = forwardRef(({ className = "", dynamicView = false}, ref) => {
  const containerRef = useRef(null);
  const { selectedTrace, nodes, setNodes, setCy, refit } = useTreeStore();
  const cyRef = useRef(null);

  const [selected, setSelected] = useState(null);
  const [toolbarPos, setToolbarPos] = useState({ x: 0, y: 0 })
  const [toolbarVisible, setToolbarVisible] = useState(false);
  const { existingSettings } = useCytoscapeStore();
  
  useEffect(() => {
    if (!containerRef.current) return;

    const cy = cytoscape({
      container: containerRef.current,
      elements: [],
      style: getCytoscapeStyles(LAYOUT.NODE_SIZE),
      layout: { name: "breadthfirst" },
      autoungrabify: true,
      wheelSensitivity: existingSettings?.wheelSensitivity,
    })

    cy.autolock(false)

    
    cy.on('tap', 'node', (evt) => {
      const node = evt.target;
      cy.nodes().removeClass('selected');
      node.addClass('selected');
      setSelected(node);
      setToolbarVisible(false);
    });

    cy.on('tap', (evt) => {
      if (!evt?.target?.isNode?.()) {
        cy.nodes().removeClass('selected');
        setSelected(null);
        setToolbarVisible(false);
      }
    });

    cy.on('cxttap', 'node', (evt) => {
      evt.originalEvent.preventDefault();   // also block native menu
      const node = evt.target;

      // highlight as before
      cy.nodes().removeClass('selected');
      node.addClass('selected');

      const { x, y } = evt.renderedPosition;
      setSelected(node);
      setToolbarPos({ x, y })
      setToolbarVisible(true);
    })

    cy.on('mousedown', () => {
      setToolbarVisible(false);
    })


    cyRef.current = cy;
    setCy(cy);

    return () => {
      cy.destroy();
      cyRef.current = null;
      setCy(null);
    };
  }, [existingSettings])

  useEffect(() => {
    const cy = cyRef.current;
    
    if (!cy) return;
    
    cy.elements().remove();
    cy.add(nodes);

    if (selected) cy.getElementById(selected.id()).addClass("selected")

    cy.add(
      nodes.filter(item => item.data.caller !== -1).map(item => ({
        group: 'edges',
        data: {
          id:     `${item.data.caller}-${item.data.id}`,
          source: item.data.caller,
          target: item.data.id
        }
      }))
    );

    // cy.layout().run();
  }, [nodes]);


  function splitCamelCase(str) {
    return str
      .split(/(?=[A-Z\.])/)
      .filter(Boolean)    // drop any leading empty string
      .join('\u200b');
  }

  const renderTree = (result, anchor) => {
    const newNodes = {};

    result.forEach((data) => {
      // const {parent, ...node} = data
      newNodes[data.id] = { data: {...data, isRoot: data.caller === -1}, isRoot: data.caller === -1, id: data.id};
      
    });
    const coloring = {};
    return getNodes(Object.values(newNodes).map(node => node.data.nodeid))
      .then((data) => {
        const node_mapping = {}
        data.nodes.forEach((item) => {
          // console.log(item.node.functions.filter(item => ))
          const value = role_stereotype_colors[item.node.properties.roleStereotype] ?? {h: 30, s: 0.25, l: 0.91}

          coloring[item.id] = `hsl(${value['h']}, ${value['s']*100}%, ${value['l']*100}%)`
          node_mapping[item.id] = item.node
          item.node.functions.forEach(func => {
            node_mapping[func.id] = func.properties
            const value = role_stereotype_colors[func.properties.stereotype] ?? {h: 30, s: 0.25, l: 0.91}
            // coloring[func.id] = `hsl(${value['h']}, ${value['s']*100}%, ${value['l']*100}%)`


          })
        });
        
        Object.values(newNodes).forEach(node => {1
          
          node.data.color = coloring[node.data.nodeid]
          node.data.cvizNode = node_mapping[node.data.nodeid]
          node.data.functionData = node_mapping[node.data.functionid]
          
          node.data.function = node
          
          node.data.label = splitCamelCase(node.data?.functionData?.simpleName ?? "")
          node.id = parseInt(node.id)
          node.data.id = parseInt(node.data.id)
        })

        
        const nodes_list = Object.values(newNodes)

        nodes_list.sort((a, b) => (a.id < b.id) ? -1: 1);

        repositionNodes(nodes_list, anchor)
        setNodes( nodes_list );
      })

  };

  function resetGraph() {
    if (selectedTrace && selectedTrace !== "None") {
      setNodes([])
      getTreeRoot(selectedTrace)
        .then(result => renderTree(result, null))
        .then(() => refit());
    }
  }

  // Fetch tree when selectedTrace changes
  useEffect(() => {
    resetGraph()
  }, [selectedTrace]);

  useImperativeHandle(ref, () => {
    return {
      resetGraph
    }
  })

  const getChildren = (selected) => {
    const cy = cyRef.current;
    
    if (!cy) return;
    
    getTreeChildren(selected.id(), selectedTrace)
      .then(result => {
        renderTree(result.concat(nodes.map(item => item.data)), selected)
      })
  }

  const getCurrentAncestors = (node) => {
    const targets = node.outgoers().targets()
    let ancestors: any[] = [];
    targets.forEach((target: any) => {
      ancestors = [...ancestors, target, ...getCurrentAncestors(target)]
    })

    return ancestors
  }

  const getAncestors = (selected) => {
    const cy = cyRef.current;
    
    if (!cy) return;

    obtainAncestors(selected, selectedTrace)
      .then(result => renderTree(result.concat(nodes.map(item => item.data)), selected))
  }

  const hideChildren = (selected) => {

    const ancestors = getCurrentAncestors(selected).map(item => item.id())
    // console.log(nodes.filter(item => !ancestors.includes(item.id.toString())))
    // setNodes(nodes.filter(item => !ancestors.includes(item.id)))
    
    renderTree(nodes.filter(item => !ancestors.includes(item.id.toString())).map(item => item.data), selected)

  }

  return (
    <MainView selected={selected} containerRef={containerRef} className={className}>
      <Legend dynamicView={true}/>
      <Toolbar toolbarPos={toolbarPos} toolbarVisible={toolbarVisible}>
        <ButtonsTrace 
          key={selected?.id()}
          selected={selected} 
          getTree={() => getChildren(selected)} 
          hideChildren={() => hideChildren(selected)}
          getAncestors={() => getAncestors(selected)}
          />
      </Toolbar>
      <SidebarDynamic
        key={selected?.id()}
        selected={selected} 
        getTree={() => getChildren(selected)} 
        hideChildren={() => hideChildren(selected)}
        getAncestors={() => getAncestors(selected)}
        />
    </MainView>
  );
});

export default DynamicView;
