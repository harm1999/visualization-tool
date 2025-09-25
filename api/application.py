from flask import Flask, render_template, request, jsonify
from Database import Database
from flask_cors import CORS
from SQLConnector import SQLConnector
import atexit
import xml.etree.ElementTree as ET

app = Flask(__name__)
CORS(app)  # This allows all domains

layers = [
    "Presentation Layer",
    "Service Layer",
    "Domain Layer",
    "Data Source Layer"
]

db = None

sql_instance = SQLConnector()
sql_instance.init_db()
db = Database(sql_instance)


atexit.register(sql_instance.close_db)

@app.route('/create-tables/', methods=["PUT"])
def create():
    sql_instance.create_tables()
    return jsonify({
        "message": "Initiated."
    }), 200

@app.route('/inject-data/', methods=["POST"])
def inject():
    if request.is_json:
        data = request.get_json()
    db.inject(data)
    return jsonify({
        "message": "JSON received."
    }), 200


@app.route('/find-name/', methods=['POST'])
def find_name():
    if request.is_json:
        data = request.get_json()

    
    return jsonify({"matches": db.check_string(data['string'])})

@app.route('/get-node/', methods=["POST"])
def get_node():
    data = request.get_json()
    node = data.get("node")
    nodes, edges = db.get_node(node)

    return jsonify({"nodes":nodes, "edges": edges})

@app.route('/get-nodes/', methods=["POST"])
def get_nodes():
    data = request.get_json()
    nodes = data.get("nodes")
    nodes = db.get_nodes(nodes)

    return jsonify({"nodes":nodes})

@app.route('/get-descendants/', methods=["POST"])
def get_descendants():
    data = request.get_json()
    node = data.get("node")
    nodes, edges = db.get_descendants(node)
    return jsonify({"nodes":nodes, "edges": edges})

@app.route('/get-children/', methods=["POST"])
def get_children():
    data = request.get_json()
    node = data.get("node")
    nodes, edges = db.get_children(node)
    return jsonify({"nodes":nodes, "edges": edges})

@app.route('/get-surroundings/', methods=["POST"])
def get_surroundings():
    data = request.get_json()
    node = data.get("node")
    nodes, edges = db.get_surroundings(node, data.get("exclude", []))
    trace = data.get("trace", False)
    if trace:
        trace_result = db.get_trace_surroundings(node, trace)
        nodes += trace_result[0]
        edges += trace_result[1]

    return jsonify({"nodes":nodes, "edges": edges})

@app.route('/get-edges/', methods=["POST"])
def get_edges():
    data = request.get_json()
    leafs = data.get("leafs")
    edges = db.get_edges(leafs, data.get("selfEdges", False))

    result = {"edges":edges}
    
    if "splitDataLayer" in data:
        print(leafs)
        nodes = db.get_nodes(leafs)

        result['nodes'] = [
            {
                "id": layer.replace(" ", "-"),
                "name": layer
            } for layer in layers + ["other"]
        ]

        for node in nodes:
            layer = node.get('node', {}).get('properties', {}).get('layer', None)
            layer = layer if layer in layers else layers[-1]
            result['edges'].append(
                {
                    "id": f"{layer.replace(" ", "-")}-contains-{node['id']}",
                    "source": layer.replace(" ", "-"),
                    "target": node['id'],
                    "type": "contains"
                })
        



    return jsonify(result)

@app.route('/get-edge-types/', methods=["POST"])
def get_edge_types():
    return jsonify(db.get_edge_types())

@app.route('/get-recommended-nodes/', methods=["POST"])
def get_recommended_nodes():
    data = request.get_json()
    return jsonify(db.get_recommended_nodes(data.get("nodes", [])))

@app.route('/upload-trace/', methods=["POST"])
def upload_trace():
    file = request.files['file']
    if file:
        print(file.filename)
        xml_bytes = file.read()
        root = ET.fromstring(xml_bytes)
        root = next(iter(root))
        db.inject_trace(root, file.filename)
        return {}

@app.route('/get-traces/', methods=["POST"])
def get_traces():
    return db.get_traces()


@app.route('/get-trace-edges/', methods=["POST"])
def get_trace_edges():
    data = request.get_json()
    trace = data.get("trace")
    leafs = data.get("leafs")

    return db.get_trace_edges(leafs, trace)

@app.route('/get-tree-root/', methods=["POST"])
def get_tree_root():
    data = request.get_json()
    return db.get_tree_root(data.get("trace"))

@app.route('/get-tree-children/', methods=["POST"])
def get_tree_children():
    data = request.get_json()
    return db.get_tree_children(data.get("leafs"), data.get("trace"))

@app.route("/get-tree-ancestors/", methods=["POST"])
def get_tree_ancestors():
    data = request.get_json()
    try:
        return db.get_tree_ancestors(data.get("leaf"), data.get("trace"))
    except Exception as e:
        return {"error": "This request resulted in too many elements."}, 400

@app.route("/get-projects/", methods=["POST"])
def get_projects():
    
    
    return jsonify({"matches": db.get_projects()})

@app.route("/generate-description/", methods=["POST"])
def generate_description():
    data = request.get_json()
    return db.generate_description(data.get("leaf"), data.get("trace"))

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=True)