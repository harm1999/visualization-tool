import { useStore, useCytoscapeStore } from "../data/store";
import { useTreeStore } from "../data/treeStore"

const request = async (endpoint, payload=null, setLoading = null, json=true) => {
  if (setLoading) setLoading(true);
  const body = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    
  }

  // const splitDataLayer = false
  const { splitDataLayer } = useCytoscapeStore.getState()
  if (payload && splitDataLayer) payload.splitDataLayer = true
  if (payload) body.body = JSON.stringify(payload);

  return fetch(`/api/${endpoint}`, body)
    .then(res => {
      if (json){
      return res.json().then(json => {
        if (res.status === 400) {
          // throw with the real message
          throw new Error(json.error);
        }
        return json;
      });} else {
        return res.text()
      }
    })
    .catch(err => {
      alert(err.message)
      // throw err;
    })
    .finally(() => {
      if (setLoading) setLoading(false);
    });
};

export const injectData = async(data, setLoading = null ) => {
  return request("/inject-data/", JSON.parse(data), setLoading)
    .then(() => getEdgeTypes())
}

export const injectTrace = async(trace, setLoading = null ) => {
  return request("/upload-trace/", trace, setLoading)
    .then(() => {return getTraces()})
}

export const getTraces = async(setLoading = null ) => {
  return request("/get-traces/", setLoading)
    .then((data) => {
      return data
    })
}

export const findName = async(searchTerm, setLoading = null) => {
  return request("/find-name/", {string: searchTerm}, setLoading)
}

export const getSurroundings = async (node, exclude, trace=null, setLoading = null) =>{
  const { addGraphNodes, addGraphEdges, incrementNodes } = useStore.getState();

  request("/get-surroundings/", { node , exclude, trace }, setLoading)
    .then(data => {
      addGraphNodes(
        data.nodes.reduce((acc, item) => {
          acc[item.id] = item.node;
          return acc;
        }, {})
      );
      addGraphEdges(data.edges);
      incrementNodes(data.nodes.map(item => item.id))
    })
};


export const getNode = async (item, setLoading = null) => {
  const { addFixedNode, addGraphNodes, addGraphEdges, incrementNodes } = useStore.getState();

  request("/get-node/", { node: item }, setLoading)
    .then(data => {
      addGraphNodes(
        data.nodes.reduce((acc, item) => {
          acc[item.id] = item.node;
          return acc;
        }, {})
      );
      addGraphEdges(data.edges);
      incrementNodes(data.nodes.map(item => item.id))
      addFixedNode(item)
    })
};

export const getNodes = async (nodes, setLoading = null) => {
  return request("/get-nodes/", { nodes }, setLoading)
};

export const getChildren = async (item, setLoading = null) => {
  const { addGraphNodes, addGraphEdges, incrementNodes } = useStore.getState();
  
  request("/get-children/", {node: item}, setLoading)
    .then(data => {
      addGraphNodes(
        data.nodes.reduce((acc, item) => {
          acc[item.id] = item.node;
          return acc;
        }, {})
      );

      addGraphEdges(data.edges);
      incrementNodes(data.nodes.map(item => item.id))
    })
};

export const getDescendants = async (item, setLoading = null) => {
  const { addGraphNodes, addGraphEdges, incrementNodes } = useStore.getState();
  request("/get-descendants/", {node: item}, setLoading)
    .then(data => {
      addGraphNodes(
        data.nodes.reduce((acc, item) => {
          acc[item.id] = item.node;
          return acc;
        }, {})
      );

      addGraphEdges(data.edges);
      incrementNodes(data.nodes.map(item => item.id))
    })
};

export const collapseChildren = async (item, setLoading = null) => {
  const { disableNodes } = useStore.getState();
  request("/get-descendants/", {node: item}, setLoading)
    .then(data => {

      disableNodes(data.nodes.map(item => item.id))
    })
  }

export const requestEdges = async (items, selfEdges = false, setLoading = null) => {
  const { addGraphNodes } = useStore.getState();
  return request("/get-edges/", {leafs: items, selfEdges: selfEdges}, setLoading)
  .then(data => data)
}

export const getTracesEdges = async ( leafs, trace, setLoading = null) => {
  if (trace == 'None') return
  
  return request("/get-trace-edges/", { leafs , trace}, setLoading)
  .then(data => data)
}

export const hideNode = async (item, setLoading = null) => {
  const { disableNodes } = useStore.getState();
  request("/get-descendants/", {node: item}, setLoading)
    .then(data => {
      
      disableNodes([
        ...data.nodes.map(el => el.id),
        item
      ])
      
    })
  }

export const getEdgeTypes = async(setLoading = null) => {
  
  const { setEdgeTypes, edgeTypes, existingSettings, setColorEdges, clearColorEdges }= useCytoscapeStore.getState()
  const palette = [
    '#FF6F61', // Coral
    '#6B5B95', // Deep Lavender
    '#88B04B', // Moss Green
    '#F7CAC9', // Blush Pink
    '#92A8D1', // Soft Sky Blue
    '#955251'  // Earthy Brown
  ];
  
  return request("/get-edge-types/", setLoading)
    .then(data => {
      const output =  data.reduce(
        (prev, cur) => ({...prev, [cur]: edgeTypes[cur] ?? true}), {}
      )

      setEdgeTypes(output)


      const colorEdges = [];
      
      if (existingSettings.showEdgeColors) {
        const n = data.length;
        
        for (let i = 0; i < n; i++){
          colorEdges.push({
            selector: `edge[type="${data[i]}"]`, 
            style: {
              // "line-color": `hsl(${i/n*360}, 100%, 50%)`,
              // 'target-arrow-color': `hsl(${i/n*360}, 100%, 50%)`,
              "line-color": palette[i],
              'target-arrow-color': palette[i],
            }
          })
        }
      } else {
        clearColorEdges()
      }

      setColorEdges(colorEdges)
      
      return colorEdges;

    })

}

export const getRecommendations = async (nodes, setLoading = null) => {

  const { setRecommendations } = useStore.getState();
  request("/get-recommended-nodes/", { nodes }, setLoading)
    .then(data => {
      
      setRecommendations(data)
      
    })
}

export const getTreeRoot = async (trace, setLoading = null) => {
  return request("/get-tree-root/", { trace }, setLoading)
}

export const getTreeChildren = async (leafs, trace, setLoading= null) => {
  return request("/get-tree-children/", { leafs, trace }, setLoading)
}

export const obtainAncestors = async(leaf, trace, setLoading = null) => {
  return request("/get-tree-ancestors/", { leaf: leaf.id(), trace }, setLoading)
}

export const getProjects = async(setLoading = null) => {
  return request("/get-projects/", null, setLoading)
}

export const generateDescription = async(leaf, trace, setLoading = null) => {
  const { setDescriptions } = useTreeStore.getState();
  return request("/generate-description/", {leaf: leaf.id(), trace}, setLoading, false)
    .then((htmlString) => {
      setDescriptions(leaf.id(), htmlString)
    })
}