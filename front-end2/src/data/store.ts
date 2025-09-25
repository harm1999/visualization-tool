import { create } from 'zustand';
import { useCytoscapeStore } from './useCytoscapeStore';
import { role_stereotype_colors, layer_colors } from "../styles/constants"
import { schemeCategory10 } from 'd3-scale-chromatic';


const COLORS = schemeCategory10;
console.log(COLORS[parseInt("") - 1])
Array(10).keys().forEach(i => console.log(i))
const layers = [
  "Presentation-Layer",
  "Service-Layer",
  "Domain-Layer",
  "Data-Source-Layer",
  "other"
]

const activeProxyHandler = {
  get: (target, name) => (name in target ? target[name] : 0)
};

type Node = {
  id: number;
  properties: Record<string, any>;
};

type Edge = {
  source: number;
  target: number;
  type: string;
};

type GraphElements = {
  nodes: Record<number, Node>;
  edges: Edge[];
};

type StoreState = {
  graphElements: GraphElements;
  nodeInfo: Record<number, Node>;
  fixedNodes: Record<number, any>; // Adjusted to use 'any' type for items
  selectedElement: Node | Edge | null; // Adjusted to either Node, Edge, or null
  popupInfo: any; // Depends on what info is displayed; using 'any' type for now
  activeNodes: Record<number, number>; // Using Record<number, number> for node activity counts
  addGraphNodes: (nodes: Record<number, Node>) => void;
  addGraphEdges: (edges: Edge[]) => void;
  incrementNodes: (ids: number[], delta?: number) => void;
  setSelectedElement: (element: Node | Edge | null) => void;
  setPopupInfo: (info: any) => void;
  addNodeInfo: (nodes: Record<number, Node>) => void;
  addFixedNode: (items: Record<number, any>) => void;
  removeFixedNode: (id: number) => void;
  clearFixedNodes: () => void;
  disableNodes: (ids: number[]) => void;
};

type CytoscapeStore = {
  cy: null;
}

export const useStore = create<StoreState>((set) => ({
  // Graph data (could also be loaded via an action)
  graphElements: { nodes: {}, edges: [] },
  nodeInfo: {},
  fixedNodes: {},
  edgeColors: {},
  recommendations: [],
  traceEdges: [],

  // UI state
  selectedElement: null,
  popupInfo: null,

  // Active counts (defaults to 0 via proxy handler)
  activeNodes: new Proxy({}, activeProxyHandler),

  // Actions to update state

  setSelectedElement: element => set({ selectedElement: element }),
  setPopupInfo: info => set({ popupInfo: info }),
  setRecommendations: recommendations =>  set({ recommendations }),
  setTraceEdges: traceEdges => set({ traceEdges }),
  addGraphNodes: nodes =>
    set(state => ({
      graphElements: {
        ...state.graphElements,
        nodes: {
          ...state.graphElements.nodes,
          ...Object.fromEntries(
            Object.entries(nodes)
              .map(([key, node]) => [ key, node?.properties?.simpleName ])
          )
        }
      },
      nodeInfo: {
        ...state.nodeInfo,
        nodes: {
          ...state.nodeInfo.nodes,
          ...nodes
        }
      }
    })),
  resetGraph: () => 
    set(() => ({
      graphElements: {
        nodes: {},
        edges: []
      }
    })),
  addGraphEdges: edges =>
    set(state => ({
      graphElements: {
        ...state.graphElements,
        edges: [...state.graphElements.edges, ...edges]
      }
    })),

  addNodeInfo: nodes =>
    set(state => ({
      nodeInfo: {
        ...state.nodeInfo,
        nodes
      }
    })),

  addFixedNode: item =>
    set(state => ({
      fixedNodes: {
        ...state.fixedNodes,
        ...item
      }
    })),
  removeFixedNode: key =>
    set(state => {
      const { [key]: _, ...remaining } = state.fixedNodes;
      return {
        fixedNodes: remaining
      };
    }),
  clearFixedNodes: () =>
    set(state => {
      return {
        fixedNodes: {}
      }
    }),
  setEdgeColoring: edges => 
    set(state => {
      const edgeColors = {};
      const n = edges.length;
      for (let i = 0; i < n; i++){
        edgeColors[edges[i]] = i/n*360;
      }

      return { edgeColors }
    }),

  // Increment or decrement node activity and show/hide in Cytoscape
  incrementNodes: (ids, delta = 1) => {
    // Get Cytoscape instance
    const cy = useCytoscapeStore.getState().cy;

    set(state => {
      const updated = { ...state.activeNodes };

      ids.forEach(id => {
        // Calculate new count
        const newCount = (updated[id] || 0) + delta;
        updated[id] = newCount;

        // If cy is available, hide or show the node
        if (cy) {
          const node = cy.getElementById(id);
          if (!node.empty()) {
            if (newCount <= 0) node.hide();
            else node.show();
          }
        }
      });

      return {
        activeNodes: new Proxy(updated, activeProxyHandler)
      };
    });
  },
  disableNodes: (ids) => {
    set (state => {
      const updated = { ...state.activeNodes };
      const newFixed = { ...state.fixedNodes };
      const cy = useCytoscapeStore.getState().cy;

      ids.forEach(id => {
        updated[id] = 0;
        
        if (cy) {
          const node = cy.getElementById(id);
          
          if (!node.empty()) {
            node.hide();
          }
        }
        if (id in newFixed) delete newFixed[id];
      })
      
      return {
        activeNodes: new Proxy(updated, activeProxyHandler),
        fixedNodes: newFixed
      };
      
    })
  }
}));



// Separate Cytoscape store to hold the instance
export const useCytoscapeStore = create<CytoscapeStore>((set, get) => ({
  cy: null,
  edgeTypes: {},
  setEdgeTypes: edges =>
    set(state => {
      return { 
        edgeTypes: edges 
      }}),
  toggleEdgeType: edge => 
    set(state => {
      const enable = !state.edgeTypes[edge]
      if (enable) {
        state.enableEdge(edge)
      } else {
        state.addDisabledEdge(edge);
      }
      return {
      edgeTypes: {
        // spread the _current_ edgeTypes from state
        ...state.edgeTypes,
        // use a computed property name so you flip the key matching your `edge` argument
        [edge]: enable
      }
    }}),
  setCreation: createCytoscapeInstance => set(createCytoscapeInstance),
  setCy: cy => set({ cy }),
  splitDataLayer: false,
  toggleSplitDataLayer: () =>
    set((state) => ({ splitDataLayer: !state.splitDataLayer })),
  relayout: (newLayout: any = null) => {
    if (newLayout) {
      set(state => ({
        existingSettings: {
          ...state.existingSettings,
          layout: newLayout,
        },
      }))
    }

    // 2) grab cy + settings from the current state
    const { cy, existingSettings, splitDataLayer } = get()



    const layout = existingSettings.layout
    if (splitDataLayer) {
      cy.nodes().forEach((node) => {
        node.data('dagreRank', layers.indexOf((node.data('layer') ?? "").replace(" ", "-")) + 1);
      })
    }
    cy.layout(layout).run()

    
  },
  refit: () => {
    const { cy } = get()
    if (cy) {
      cy.fit();  // Fit the graph to the container size
    }
  },
  groupByLayer: () => {
    const { toggleSplitDataLayer, cy, setExistingSettings, existingSettings} = get();
    toggleSplitDataLayer()
    const layers = Object.keys(layer_colors)

    cy.add(layers.map((layer) => ({
      group: 'nodes',
      data: {id: layer, label: layer, ancestorCount: 5}
    })))
    
    const relativePlacementConstraint = []

    for (let i = 0; i < layers.length - 1; i++) {
      const source = layers[i]
      const target = layers[i + 1]
      cy.add({
        group: 'edges',
        data: {id: `${source}_${target}`.replace(" ", "_"), source, target }
      })

      relativePlacementConstraint.push({
        top: source,
        bottom: target,
        gap: 100
      })

    }

    cy.nodes("[layer]").forEach(item => {
      item.move({ parent: item.data("layer") });
    })

    setExistingSettings({...existingSettings, relativePlacementConstraint})
  },
  colorEdges: [],
  setColorEdges: (colorEdges) => set(
    (state) => ({
      colorEdges: state.colorEdges.concat(colorEdges)
    })
  ),
  clearColorEdges: () => set(
    () => ({colorEdges: []})
  ),
  styleDisabledEdges: [],
  addDisabledEdge: (edge) => set(
    (state) => ({styleDisabledEdges: [...state.styleDisabledEdges, edge]})
  ),
  enableEdge: (edge) => set (
    (state) => ({
      styleDisabledEdges: state.styleDisabledEdges.filter(item => item != edge)
    })
  ),


  style: [
    { selector: 'node', style: {
      "label": 'data(label)',
      'shape': 'round-rectangle',
      'text-valign': 'center',
      'text-halign': 'center',
      // 'background-color': '#e2e8f0',      /* light gray for parent container */
      // 'background-color': `mapData(ancestorCount, 0, 3, #f0f0f0,rgb(141, 141, 141))`,
      // 'background-opacity': 0.5,
      'border-color': 'grey', 
      'border-width': 1,    /* gray border */
      'padding': 10,
      'font-size': 10,
      'height': 10,
      'width': (node:any) => { return node?.data('label')?.length * 4 }
      
      } 
    },
    { selector: 'node[ancestorCount]', style: {
      'background-color': `mapData(ancestorCount, 0, 3, #f0f0f0,rgb(141, 141, 141))`,

      
      } 
    },
    { selector: ':parent', style: {
        'shape': 'round-rectangle',
        'background-color': `mapData(ancestorCount, 0, 3, #f0f0f0,rgb(141, 141, 141))`,
        'background-opacity': 0.5,
        'text-valign': 'top',
        'padding': 10
      } 
    },

    { selector: 'edge', style: {
        'width': 2,
        'target-arrow-shape': 'chevron',
        'target-arrow-color': 'grey',
        'line-color': 'grey',
        'curve-style': 'bezier',
        'font-size': 1,
        "arrow-scale": 1
      } 
    },
    { selector: 'edge[type="contains"]', style: {
        'display': 'none'
      } 
    },
    // { selector: 'edge[type="trace"]', style: {
    //     'width': 2,
    //     'label': "data(order)",
    //     'target-arrow-shape': 'chevron',
    //     // 'line-color': '#8B0000',
    //     'curve-style': 'bezier',
    //     'font-size': 20,
    //     "arrow-scale": 1,
    //     "target-arrow-color": "#004080",
    //     "source-arrow-color": "#FFCC66",
    //     "line-gradient-stop-colors": "#FFCC66 #004080",
    //     "line-gradient-stop-positions": "0% 100%"
    //   } 
    // },
    {
      selector: 'edge[type="trace"]',
      style: {
        width: 3,
        'line-fill': 'linear-gradient',
        'line-gradient-stop-colors': '#FFCC66 #004080',
        'line-gradient-stop-positions': '0% 100%',
        "target-arrow-color": "#004080",
        'source-arrow-shape': 'none',
        'target-arrow-shape': 'chevron',
        'curve-style': 'bezier',
        'edge-text-rotation': 'autorotate',
        label: 'data(order)',
        'font-size': 20,
        'arrow-scale': 1.5
      }
    },
    {
      selector: '.highlight',
      style: {
        'border-color': '#3b82f6',
        'line-color': '#3b82f6',
        'target-arrow-color': '#3b82f6',
        'background-opacity': 0.75
      },
    },
    ...Object.entries(role_stereotype_colors).map(([key, value]) => ({
      selector: `node[roleStereotype="${key}"]`,
      style: {
        'background-color': `hsl(${value['h']}, ${value['s']*100}%, ${value['l']*100}%)`
      }
    })),
    // ...Array.from(Array(10).keys()).map(i => ({
    //   selector: `node[group="${i + 1}"]`,
    //   style: {
    //     'background-color': COLORS[i]
    //   }
    // }))

    // ...Object.entries(layer_colors).map(([key, value]) => ({
    //   selector: `node[layer="${key}"]`,
    //   style: {
    //     'background-color': `hsl(${value['h']}, ${value['s']*100}%, ${value['l']*100}%)`
    //   }
    // }))
],
  existingSettings: {
    elements: [],
    layout: {
      name: 'dagre',
      animate: true,
      maxSimulationTime: 1000,
      rankDir: 'TB',
      // nodeRank: 'dagreRank',
      // ranker:       'network-simplex',
      randomize: true

    },
    textureOnViewport: false,
    hideEdgesOnViewport: false,
    wheelSensitivity: 0.1,
    showEdgeColors: false,
    automaticRelayout: true,
    renderer: {
      name: 'canvas'
    },
  },
  setExistingSettings: (s) => set({ existingSettings: s })
}));
