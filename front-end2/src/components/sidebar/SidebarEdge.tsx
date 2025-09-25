import ButtonsNodes from "../ButtonsNodes"
import DisplayNodeDetails from "../elements/DisplayNodeDetails";
import { useStore } from '../../data/store';

const SidebarNode = ({ selectedEdge }) => {

  const nodeInfo = useStore(s => s.nodeInfo);
  const source = selectedEdge.source();
  const target = selectedEdge.target();
  
  const label = selectedEdge.data("type");

  const data = {
    Source: nodeInfo.nodes[source.data('id')],
    Target: nodeInfo.nodes[target.data('id')]
  }

  return (
    
    <div>
        <h2 className="text-sm font-semibold mb-2 w-full border-b-1">Edge</h2>
          <div className="mb-4">
            <h3 className="text-sm font-semibold mb-2">Type</h3>
            <div className="text-xs p-1 rounded whitespace-normal break-words">
              
              {label}

            </div>
          </div>

      {Object.entries(data).map(([name, obj]) => (
        <DisplayNodeDetails key={name} title={name} node={obj}/>
        // <div key={name}>
        //   <h2 className="text-sm font-semibold mb-2 w-full border-b-1">{name}</h2>
        //   {Object.entries(obj).map(([key, value]) => (
        //       <div key={key} className="mb-4">
        //       <h3 className="text-sm font-semibold mb-2">{key}</h3>
        //       <pre className="text-xs bg-gray-100 p-2 rounded whitespace-normal break-words">
                
        //         {key == 'properties' ? Object.entries(value).map(([key1, value1]) => (
        //           (<div key={key1} className="mb-4">
        //             <h4 className="font-semibold mb-2">{key1}</h4>
        //             <pre className="text-xs bg-gray-100 p-2 rounded whitespace-normal break-words">
        //               {value1}
    
        //             </pre>
        //           </div>)))
        //          : String(value)}

        //       </pre>
        //     </div>
        //     ))}
        // </div>
      ))}
    </div>
  );
};

export default SidebarNode;