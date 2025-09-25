// StaticView.tsx
import { useRef, useEffect, useState } from 'react';
import { useCytoscapeStore, useStore } from './data/store';
import { useTreeStore } from './data/treeStore';
import cytoscape from 'cytoscape';
import klay from 'cytoscape-klay';
import fcose from 'cytoscape-fcose';
import cola from 'cytoscape-cola';
// import dagre from 'dagre';
import cytoscapeDagre  from 'cytoscape-dagre';
import elk from 'cytoscape-elk';
import cytoscapeCanvas from 'cytoscape-canvas';
import SidebarStatic from './components/SidebarStatic';
import ButtonsNodes from './components/ButtonsNodes';
import { requestEdges, getEdgeTypes, getTracesEdges } from "./utils/apiHelper"
import Toolbar from "./assets/Toolbar"
import MainView from './assets/MainView';
import Legend from './assets/Legend';


cytoscape.use(klay);
cytoscape.use(fcose);
cytoscape.use(cola);
cytoscape.use(cytoscapeDagre );
cytoscape.use(elk);
cytoscape.use(cytoscapeCanvas);


const StaticView = ( { className = ""}) => {
  const containerRef = useRef(null);

  const graphData = useStore(s => s.graphElements);
  const activeNodes = useStore(s => s.activeNodes);
  const selectedTrace = useTreeStore(s => s.selectedTrace);
  const existingSettings = useCytoscapeStore(s => s.existingSettings);
  const setCy = useCytoscapeStore(s => s.setCy);
  const cy = useCytoscapeStore(s => s.cy);
  const style = useCytoscapeStore(s => s.style);

  const setColorEdges = useCytoscapeStore(s => s.setColorEdges);
  const colorEdges = useCytoscapeStore(s => s.colorEdges);
  const styleDisabledEdges = useCytoscapeStore(s => s.styleDisabledEdges);
  

  const [toolbarPos, setToolbarPos] = useState({ x: 0, y: 0 });
  const [toolbarVisible, setToolbarVisible] = useState(false);
  const relayout = useCytoscapeStore((state) => state.relayout)
  const nodeInfo = useStore(s => s.nodeInfo);

  const [selected, setSelected] = useState(null);


  const createCytoscapeInstance = (settings) => {
      if (cy) {cy.destroy(); console.log("DESTROY");};
      getEdgeTypes().then(colorEdges => setColorEdges(colorEdges))


      const cyNew = cytoscape({ ...settings, container: containerRef.current});

      // cyNew.style((style ?? []).concat(colorEdges).concat(style[style.length - 1]))
      
      setCy(cyNew);

      cyNew.on('cxttap', 'node', (evt) => {
        evt.originalEvent.preventDefault();   // also block native menu
        const node = evt.target;
  
        // highlight as before
        cyNew.nodes().removeClass('highlight');
        node.addClass('highlight');
  
        // get pixel coords to position your toolbar
        const { x, y } = evt.renderedPosition;
        setSelected(node);
        setToolbarPos({ x, y });
        setToolbarVisible(true);
      });

      // Node click handler
      cyNew.on('tap', 'node', (evt) => {
        const node = evt.target;
        cyNew.nodes().removeClass('highlight');
        cyNew.edges().removeClass('highlight');
        node.addClass('highlight');
        setSelected(node);
        setToolbarVisible(false);
      });

      // Edge click handler
      cyNew.on('tap', 'edge', (evt) => {
        const edge = evt.target
        
        cyNew.nodes().removeClass('highlight');
        cyNew.edges().removeClass('highlight');
        edge.addClass('highlight');
        
        setSelected(edge);
        setToolbarVisible(false);
      });

      // Click background to clear
      cyNew.on('tap', (evt) => {
        if (evt.target === cyNew) {
          cyNew.nodes().removeClass('highlight');
          cyNew.edges().removeClass('highlight');
          setSelected(null);
          setToolbarVisible(false);
        }
      });

      cyNew.on('mousedown', (evt) => {
        if (evt.target === cyNew) {
          setToolbarVisible(false);
        }
      });

      setStyling()

      return cyNew
  };

  

  // 1) Initialize Cytoscape once:
  useEffect(() => {
    if (existingSettings) {
      createCytoscapeInstance(existingSettings);
    }
  }, [existingSettings]);


  const setStyling = () => {
    if (cy) cy.style((style ?? [])
      .concat(colorEdges)
      .concat(
        styleDisabledEdges.map(edge => 
          ({ 
            selector: `edge[type="${edge}"]`, 
            style: {
              'display': 'none'
            }
          })
        )
      )
      .concat(style[style.length - 1]))
  }

  useEffect(() => {
    if (!cy) return;
    setStyling()
    
  }, [colorEdges, styleDisabledEdges])


  // 2) On graphData change, diff and update:
  useEffect(() => {
    if (!cy) return;

    // Remove nodes no longer in data
    cy.nodes().forEach(n => {
      if (!graphData.nodes[n.id()]) {
        n.remove();
      }
    });

    // Remove edges no longer in data
    cy.edges().forEach(e => {
      e.remove();
      const key = e.data('id');
      if (!graphData.edges.some(ed => ed.id === key)) {
        e.remove();
      }
    });

    // Add or update nodes
    Object.entries(graphData.nodes).forEach(([id, label]) => {
      // Determine parent if there's a 'contains' edge
      if (!nodeInfo?.nodes?.[id]?.properties) return;
      const { roleStereotype, layer, group } = nodeInfo.nodes[id].properties;

      const data = {
        id,
        label,
        inactive: activeNodes[id] === 0 ? 'True' : 'False',
        ...( roleStereotype ? { roleStereotype } : {}),
        ...( layer ? { layer } : {}),
        ...( group ? { group } : {}),
        node: nodeInfo.nodes[id]
      };

      if (group) console.log(data)



      const node = cy.getElementById(id);
      if (node.empty()) {
        cy.add({ group: 'nodes', data });
      } else {
        node.data(data);
      }
    });
    
    function addEdge(edge) {
      if (styleDisabledEdges.includes(edge.type)) return;

      if (cy.elements(`edge#${edge.id}`).length == 0){
        cy.add( {group: 'edges', data: edge})
        
      }
      if (edge.type == "contains") {
        const target = cy.getElementById(edge.target)
        if (target) target.move({ parent: edge.source });
      }
    }

    // Add edges (and set parents) without duplicating
    graphData.edges.forEach(edge => {
      addEdge(edge)
    });

    cy
      .nodes("[inactive = 'False']")
      .filter(n => n.children("[inactive = 'False']").length == 0)
      .children()
      .forEach((child) => {child.move({ parent: null })})

    cy.remove("node[inactive = 'True']")
    cy.remove('edge[type="contains"]')
    
    cy.remove('edge[type!="contain"]')
    
    cy.nodes().forEach(n => {
      
      const count = n.ancestors().length;
      n.data('ancestorCount', count);
    });
    
    Promise.all([
    requestEdges(cy.nodes('node:childless').map(item=> item.data("id")), existingSettings.selfEdges)
      .then((data) => {
        if (data.nodes) {
          cy.add(data.nodes.map(item => ({ group: 'nodes', data: {...item, label: item.name, ancestorCount: 1, layer: item.name} })))
          for (let i = 0; i < data.nodes.length - 1; i++) {
            addEdge({source: data.nodes[i].id, target: data.nodes[i + 1].id, type: "layout", weight: 10000})
          }
        }

        data.edges.forEach(item => addEdge(item))
        // cy.add(
        //   edges.filter(item => !styleDisabledEdges.includes(item.type)).map(item => ({
        //     group: "edges",
        //     data: item,
        //     classes: item.data
        //   }))
        // )
      }), 
    
    getTracesEdges(cy.nodes("node:childless").map(item => item.data("id")), selectedTrace)
      .then((traceEdges) => {
        if (!traceEdges) return;
        const seen = new Set()
        traceEdges = traceEdges
          .sort((a, b) => a.order - b.order)
          .filter(item => {
            if (seen.has(item.id)) return false;
            seen.add(item.id)
            return true;
          })
          .map((item, idx) => ({...item, order: String(idx)}));
        cy.add(
          traceEdges.map(item => ({
            group: "edges",
            data: item,
            classes: item.data
          }))
        )
      })]).then(() => {
        if (existingSettings.automaticRelayout) relayout();
      })
  }, [graphData, activeNodes, cy, selectedTrace, styleDisabledEdges]);


  return (
    <MainView selected={selected} containerRef={containerRef} className={className}>
      <Legend dynamicView={false}/>
      <Toolbar toolbarPos={toolbarPos} toolbarVisible={toolbarVisible}>
        <ButtonsNodes selectedNode={selected} disableToolbar={setToolbarVisible}/>
      </Toolbar>
      <SidebarStatic selected={selected} />
    </MainView>
  );
};

export default StaticView;