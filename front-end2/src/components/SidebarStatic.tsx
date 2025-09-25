import SidebarNode from "./sidebar/SidebarNode"
import SidebarEdge from "./sidebar/SidebarEdge"
import Sidebar from "../assets/Sidebar";

const SidebarStatic = ({ selected }) => {
  
  const node = selected == null || selected.isNode();

  return (
    <Sidebar selected={selected}>
      {
        (node ? (<SidebarNode selectedNode={selected}/>) : (<SidebarEdge selectedEdge={selected}/>))
      }
    </Sidebar>
  );
};

export default SidebarStatic;
