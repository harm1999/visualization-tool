// TracesPopup.tsx
import React, { useState, useEffect } from 'react';
import Popup from '../../assets/Popup';
import { getTraces } from '../../utils/apiHelper';
import { useTreeStore } from '@/data/treeStore';
import Button from "../elements/Button";

const TracesPopup = ({ open, onClose }) => {
  const [tracesList, setTracesList] = useState([]);
  const [selectedTrace, setSelectedTrace] = useState('None');
  const setSelectedTraceStore = useTreeStore(s => s.setSelectedTrace);

  useEffect(() => {
    if (!open) return;
    getTraces()
      .then(data => setTracesList(['None', ...data]))
      .catch(err => console.error('Error fetching traces:', err));
  }, [open]);

  const handleSave = () => {
    setSelectedTraceStore(selectedTrace);
    onClose();
  };

  const footer = (
    <>
      <Button className="bg-tool-blue text-white" onClick={onClose}>Cancel</Button>
      <Button className="bg-tool-blue text-white" onClick={handleSave}>Save</Button>
    </>
  );

  return (
    <Popup open={open} onClose={onClose} title="Select trace" footer={footer}>
      <select
        className="w-full p-2 border border-gray-300 rounded text-black bg-white"
        value={selectedTrace}
        onChange={e => setSelectedTrace(e.target.value)}
      >
        {tracesList.map(trace => (
          <option key={trace} value={trace}>{trace}</option>
        ))}
      </select>
    </Popup>
  );
};

export default TracesPopup