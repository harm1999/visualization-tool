
import React, { useState, useEffect, useRef } from "react";
import SearchBox from "./elements/SearchBox"
import EdgeChecks from "./elements/EdgeChecks";
import RecommendationsList from "./elements/RecommendationsList";
import { useCytoscapeStore, useStore } from '../data/store';
import { useTreeStore } from "@/data/treeStore";
import Button from "./elements/Button"
import SettingsPopup from "./Settings";
import TracesPopup from "./popup/TracesPopup";
import { ChevronRightIcon } from '@heroicons/react/24/outline'
import { injectData, injectTrace } from "../utils/apiHelper"
import { layer_colors } from "@/styles/constants";


const Sidebar = ({toggleDynamicView, dynamicView, resetGraph}) => {
  // State for collapse toggle, search query, and search results
  const [collapsed, setCollapsed] = useState(false);

  const [settingsOpen, setSettingsOpen] = useState(false);

  const openSettings = () => setSettingsOpen(true);

  const [tracesOpen, setTracesOpen] = useState(false);

  const openTraces = () => setTracesOpen(true);
  
  const { refit, selectedTrace } = useTreeStore()

  // Toggle sidebar collapsed state
  const toggleSidebar = () => setCollapsed(prev => !prev);

  const fileInputRef = useRef(null);
  const traceInputRef = useRef(null);

  const handleButtonUpload = (ref) => {
    ref.current.click(); // Trigger file input on button click
  };

  const handleFileChange = async (e, func) => {
    e.preventDefault();

    const file = e.target.files[0];

    const reader = new FileReader();
    
    reader.onload = async(evt) => {
      const text = evt.target.result;
      console.log(text)
      func(text)
    }
    reader.readAsText(file);
  };

  const handleFileUpload = async (e, func) => {
    e.preventDefault();

    const file = e.target.files[0];

    const formData = new FormData();
    formData.append('file', file, file.name)

    try {
      const res = await fetch('http://127.0.0.1:5000/upload-trace/', {
        method: 'POST',
        body: formData,
        // NOTE: do NOT set Content-Type header; the browser will add the correct boundary
      });

      if (!res.ok) {
        throw new Error(`Server responded ${res.status}`);
      }
      const data = await res.json();
    
    } catch (err) {
    
    }
  };


  const cy = useCytoscapeStore((state) => state.cy);
  const fitGraph = () => {
    if (cy) {
      cy.fit();  // Fit the graph to the container size
    }
  };

  // const { existingSettings, setExistingSettings } = useStore();
  const cyTree = useTreeStore((state) => state.cy);

  // const resetGraph = () => {
  //   if (!dynamicView && cy){
  //     cy.json({elements:[]})
      
  //     graphData.nodes = []
  //     graphData.edges = []
  //     clearFixedNodes()
  //   } else if (dynamicView && cyTree) {
  //     setNodes([])
      
      
  //   }
  // }

  const { relayout, existingSettings, setExistingSettings, toggleSplitDataLayer } = useCytoscapeStore()

  const relayoutGraph = () => {
    relayout();
  }



  const exportImage = () => {
    const instance = dynamicView ? cyTree : cy;

    // 1. Get a PNG data URL (you can pass options: full canvas, bg color, scale…)
    const pngData = instance.png({
      scale: 5             // increase resolution (optional)
    });

    // 2. Create a temporary link element
    const link = document.createElement('a');
    link.href = pngData;
    link.download = 'network.png';  // the filename to save as

    // 3. Append, click & remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const groupByLayer = () => {
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
  }


  return (
    <div
      className={`
        relative p-2
        flex flex-col
        h-full
        bg-gray-900 text-gray-100
        transition-all duration-300
        ${collapsed ? 'w-0' : 'w-64'}
      `}
    >
      
      {/* Header: Search field and Collapse toggle button */}
      {collapsed ? 
      <div onClick={toggleSidebar} className="absolute h-8 w-10 rounded-sm border-2 border-gray-900 position-absolute border-solid ml-1 cursor-pointer z-50">
        <ChevronRightIcon className="h-full ml-1 text-gray-900 "/>
      </div> 
      :
      (
      <div><div className="grid grid-cols-2 gap-2 mb-5">
        <Button onClick={() => handleButtonUpload(fileInputRef)}>Upload json
          <nav className="flex-1 px-2 space-y-1">
            <input
              type="file"
              accept=".json"
              ref={fileInputRef}
              className="hidden"
              onChange={(e) => handleFileChange(e, injectData)}
            />
          </nav>
        </Button>
        <Button onClick={() => !dynamicView ? fitGraph() : refit()}>Fit graph</Button>
        <Button onClick={resetGraph}>Reset graph</Button>
        <Button onClick={() => !dynamicView ? relayoutGraph() : refit()}>Relayout</Button>
        <Button onClick={openSettings}>Settings</Button>
        <Button onClick={toggleSidebar}>Toggle sidebar</Button>
        <Button onClick={() => handleButtonUpload(traceInputRef)}>Upload trace
          <nav className="flex-1 px-2 space-y-1">
            <input
              type="file"
              accept=".xml"
              ref={traceInputRef}
              className="hidden"
              onChange={(e) => handleFileUpload(e, injectTrace)}
            />
          </nav>
        </Button>
        <Button onClick={openTraces}>Select trace</Button>
        <Button onClick={() => {if (toggleDynamicView() && selectedTrace == 'None') openTraces()}}>Toggle dynamic view</Button>
        <Button onClick={() => exportImage()}>Export image</Button>
        <Button onClick={() => groupByLayer()}>Order by layer</Button>
        
      </div>
  
      {/* Only hide these when collapsed */}
      <div className={`${collapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'} transition-opacity duration-200`}>
        <SearchBox />
        {/* <RecommendationsList /> */}
        <EdgeChecks />

        {/* <FixedNodeList /> */}


        <SettingsPopup open={settingsOpen} onClose={() => setSettingsOpen(false)} />
        <TracesPopup open={tracesOpen} onClose={() => setTracesOpen(false)} />
      </div></div>)
      }
    </div>
  )
  
};

export default Sidebar;