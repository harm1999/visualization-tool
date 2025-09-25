import ButtonsNodes from "../ButtonsNodes";
import { useStore } from '../../data/store';
import CollapsibleSection from "../elements/CollapsibleSection"
import DisplayNodeDetails from "../elements/DisplayNodeDetails";

const SidebarNode = ({ selectedNode }) => {
  const nodeInfo = useStore((s) => s.nodeInfo);
  const node =
    selectedNode && nodeInfo.nodes[selectedNode.data('id')]
      ? nodeInfo.nodes[selectedNode.data('id')]
      : {};

  return (
    <div>
      <ButtonsNodes selectedNode={selectedNode} />
      {selectedNode && (
        <DisplayNodeDetails title="Node Details" node={node}/>
      )}
    </div>
  );
};

export default SidebarNode;
