// StartupPopup.tsx
import { useState, useEffect } from 'react';
import Popup from '../../assets/Popup';
import { getProjects, getNode } from '../../utils/apiHelper';
import Button from "../elements/Button";

const StartupPopup = ({ open, onClose }) => {
  const [projectList, setProjectList] = useState([]);



  const [selectedProject, setSelectedProject] = useState(null);
  useEffect(() => {
    getProjects()
    .then(data => {
        setProjectList(data.matches || []); 
        setSelectedProject(data?.matches?.[0]?.id)
    })
  }, []);


  const onSave = () => {
    getNode(selectedProject)
    onClose()
  }


  if (!open) return null
  
  const footer = (
    <>
      <Button className="bg-tool-blue text-white" onClick={onClose}>Cancel</Button>
      <Button className="bg-tool-blue text-white" onClick={onSave}>Select</Button>
    </>
  );

  return (
    <Popup open={open} onClose={onClose} title="Select project" footer={footer}>
      <select
        className="w-full p-2 border border-gray-300 rounded text-black bg-white"
        value={selectedProject ?? ''}
        onChange={e => setSelectedProject(e.target.value)}
      >
        {projectList.map(proj => (
          <option key={proj.id} value={proj.id}>
            {proj.name}
          </option>
        ))}
      </select>
    </Popup>
  );
};

export default StartupPopup