import { useState, useRef } from 'react';
import StaticView from './StaticView';
import DynamicView from './DynamicView'
import CytoscapeColaExample from "./test"
import { Header } from './components/Header';
import StartupPopup from './components/popup/StartupPopup';
import TracesPopup from './components/popup/TracesPopup';
import SearchPopup from './components/popup/SearchPopup';
import { useTreeStore } from './data/treeStore';
import SettingsPopup from './components/Settings';
import { useCytoscapeStore, useStore } from './data/store';
import EdgeChecksPopup from './components/popup/EdgeChecksPopup';

function App() {
  const dynamicRef = useRef(null);
  const staticRef = useRef(null);
  const { selectedTrace, refit: refitDynamic, cyTree, resetGraph: resetGraphDynamic } = useTreeStore()
  const { relayout, refit: refitStatic, groupByLayer, cy } = useCytoscapeStore()
  const { resetGraph: resetGraphStatic} = useStore()
  
  const [dynamicView, setDynamicView] = useState(false);
  const [startupPopup, setStartupPopup] = useState(true);
  const [tracesOpen, setTracesOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [edgeChecksOpen, setEdgeChecksOpen] = useState(false);

  const openSettings = () => setSettingsOpen(true);
  const openTraces = () => setTracesOpen(true);
  const openSearch = () => setSearchOpen(true);
  const openEdgeTypes = () => setEdgeChecksOpen(true);
  // 2) Use the setter to flip state
  function toggleDynamicView() {
    setDynamicView(prev => !prev);
    if (selectedTrace == 'None') openTraces();
    return !dynamicView;
  }

  function resetGraph(){
    return dynamicView ? resetGraphDynamic?.() : resetGraphStatic();
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

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-white">
      <Header className="w-100 bg-gray-900" onclicks={{
        resetGraph, 
        toggleDynamicView, 
        dynamicView, 
        openSettings,
        relayout: () => !dynamicView ? relayout() : refitDynamic(),
        refit: () => !dynamicView ? refitStatic() : refitDynamic(),
        groupByLayer,
        exportImage,
        openTraces,
        openSearch,
        openEdgeTypes
        }}/>
      <div className='flex flex-1'>
        <div className="flex-1">
          <StaticView className={dynamicView ? "hidden" : ""} />
          <DynamicView className={dynamicView ? "" : "hidden"} dynamicView={dynamicView}/>
        </div>
      </div>
      {/* <CytoscapeColaExample/> */}
      <StartupPopup open={startupPopup} onClose={() => setStartupPopup(false)}/>
      <TracesPopup open={tracesOpen} onClose={() => setTracesOpen(false)} />
      <SettingsPopup open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <SearchPopup open={searchOpen} onClose={() => setSearchOpen(false)}/>
      <EdgeChecksPopup open={edgeChecksOpen} onClose={() => setEdgeChecksOpen(false)}/>
    </div>
  );
}


export default App;
