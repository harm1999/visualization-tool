// Settings.tsx
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import Button from './elements/Button'
import { useCytoscapeStore } from '../data/store';
import { start } from 'repl';

const SettingsPopup = ({ open, onClose, currentLayout, currentWheelSensitivity }) => {

  const settings = useCytoscapeStore((state) => state.existingSettings);
  const [layout, setLayout] = useState(settings.layout.name || 'fcose');
  const [wheelSensitivity, setWheelSensitivity] = useState(settings.wheelSensitivity || 0.1);
  const [enableOptimize, setEnableOptimize] = useState(settings.hideEdgesOnViewport);
  const [showEdgeColors, setShowEdgeColors] = useState(settings.showEdgeColors);
  const [selfEdges, toggleSelfEdges] = useState(settings.selfEdges)
  const [automaticRelayout, setAutomaticRelayout] = useState(settings.automaticRelayout)
  

  const setExistingSettings = useCytoscapeStore(s => s.setExistingSettings);

  const onSave = ({ layout, wheelSensitivity, enableOptimize, showEdgeColors, selfEdges, automaticRelayout }) => {
    if (!settings) return;

    const updated = {
      ...settings,
      layout: { ...settings.layout, name: layout },
      wheelSensitivity: wheelSensitivity,
      hideEdgesOnViewport: enableOptimize,
      textureOnViewport: enableOptimize,
      showEdgeColors,
      selfEdges,
      automaticRelayout
    }
    
    setExistingSettings(updated);
    localStorage.setItem("cytoscapeSettings", JSON.stringify({
      layout: { name: layout },
      wheelSensitivity,
      hideEdgesOnViewport: enableOptimize,
      textureOnViewport: enableOptimize,
      showEdgeColors,
      selfEdges,
      automaticRelayout
    }))
  }

  const handleSave = () => {
    onSave({ layout, wheelSensitivity, enableOptimize, showEdgeColors, selfEdges, automaticRelayout });
    onClose();
  };

  useEffect(() => {

    const oldSettings = localStorage.getItem("cytoscapeSettings")
    
    if (oldSettings){
      const parsed = JSON.parse(oldSettings);
      setLayout(parsed.layout.name);
      setWheelSensitivity(parsed.wheelSensitivity);
      setEnableOptimize(parsed.hideEdgesOnViewport);
      setShowEdgeColors(parsed.showEdgeColors);
      setShowEdgeColors(parsed.automaticRelayout);
      toggleSelfEdges(parsed.selfEdges)
      onSave({ 
        layout: parsed.layout.name, 
        wheelSensitivity: parsed.wheelSensitivity ,
        enableOptimize: parsed.hideEdgesOnViewport, 
        showEdgeColors: parsed.showEdgeColors,
        selfEdges: parsed.selfEdges,
        automaticRelayout: parsed.automaticRelayout
      })
    }
  }, []);


  if (!open) return null;


  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black opacity-50" onClick={handleSave} />

      {/* Modal container */}
      <div className="bg-gray-800 text-gray-100 rounded-2xl p-6 z-10 w-11/12 max-w-md shadow-xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Settings</h2>
          <Button onClick={onClose}>
            <X size={20} />
          </Button>
        </div>

        {/* Settings options */}
        <div className="space-y-4">
          <div>
            <label className="block">
              <span>Layout</span>
              <select
                value={layout}
                onChange={e => setLayout(e.target.value)}
                className="mt-1 block w-full bg-gray-700 text-gray-100 rounded p-2"
              >
                <option value="dagre">Dagre</option>
                <option value="fcose">Fcose</option>
                <option value="cola">Cola</option>
                <option value="klay">Klay</option>
              </select>
            </label>
          </div>

          <div>
            <label className="block">
                <span className="flex justify-between">
                    <span>Wheel Sensitivity</span>
                    <span className="font-medium">{wheelSensitivity.toFixed(2)}</span>
                </span>
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={wheelSensitivity}
                    onChange={e => setWheelSensitivity(parseFloat(e.target.value))}
                    className="mt-1 w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
            </label>
          </div>

          <div>
            <label className="inline-flex items-center cursor-pointer">
            <input
                type="checkbox"
                checked={enableOptimize}
                onChange={e => setEnableOptimize(e.target.checked)}
                className="form-checkbox h-5 w-5 text-blue-500 bg-gray-700 border-gray-600 rounded focus:ring focus:ring-blue-300"
            />
            <span className="ml-2 text-gray-200">Optimize performance</span>
            </label>
        </div>
        <div>
            <label className="inline-flex items-center cursor-pointer">
            <input
                type="checkbox"
                checked={showEdgeColors}
                onChange={e => setShowEdgeColors(e.target.checked)}
                className="form-checkbox h-5 w-5 text-blue-500 bg-gray-700 border-gray-600 rounded focus:ring focus:ring-blue-300"
            />
            <span className="ml-2 text-gray-200">Enable colors edges</span>
            </label>
        </div>
        <div>
            <label className="inline-flex items-center cursor-pointer">
            <input
                type="checkbox"
                checked={selfEdges}
                onChange={e => toggleSelfEdges(e.target.checked)}
                className="form-checkbox h-5 w-5 text-blue-500 bg-gray-700 border-gray-600 rounded focus:ring focus:ring-blue-300"
            />
            <span className="ml-2 text-gray-200">Enable self edges</span>
            </label>
        </div>
        <div>
            <label className="inline-flex items-center cursor-pointer">
            <input
                type="checkbox"
                checked={automaticRelayout}
                onChange={e => setAutomaticRelayout(e.target.checked)}
                className="form-checkbox h-5 w-5 text-blue-500 bg-gray-700 border-gray-600 rounded focus:ring focus:ring-blue-300"
            />
            <span className="ml-2 text-gray-200">Automatic relayout</span>
            </label>
        </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end space-x-2">
          <Button
            onClick={handleSave}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPopup;
