import Sidebar from "../assets/Sidebar";
import ButtonsTrace from "./ButtonsTrace";
import CollapsibleSection from "./elements/CollapsibleSection";
import DisplayFunctionDetails from "./elements/DisplayFunctionDetails";
import DisplayNodeDetails from "./elements/DisplayNodeDetails";
import { TraceDescriptions } from "./elements/TraceDescriptions";

const SidebarDynamic = ({ selected, getTree, hideChildren, getAncestors}) => {
  function splitByCh(str, pattern) {
    return str.replace(pattern, match => "\u200b" + match);
  }
  const order = [
    {value: selected?.data()?.functionData?.simpleName, text: 'Name'},
    {value: selected?.data()?.starttime, text: 'Start time'},
    {value: selected?.data()?.time, text: 'Duration'},
  ]


  return (
    <Sidebar selected={selected}>
      {selected && (
        <div>
          <ButtonsTrace 
            key={selected?.id()} 
            getTree={getTree} 
            selected={selected} 
            hideChildren={hideChildren}
            getAncestors={getAncestors}/>
          <TraceDescriptions selected={selected} />
          <CollapsibleSection title="Leaf Details" level={2}>
            {order.filter(item => item.value).map((item, idx) => (
              <CollapsibleSection title={item.text} key={idx} level={3}>
                <div className="text-xs p-1 rounded whitespace-normal break-words">
                  {splitByCh(String(item.value), /\./g)}
                </div>
                
              </CollapsibleSection>
            ))}
          </CollapsibleSection>
          {(selected.data("cvizNode")?.functions ?? []).filter((item) => selected.data('cvizFunction') == item.cvizId).map((item) => (
            <DisplayFunctionDetails level={2} node={item} key={item.cvizId} defaultOpen={true}/>
          ))}
          <DisplayNodeDetails title="Node details" node={(() => {
            const { functions = [], ...rest } = selected.data("cvizNode") || {};
            return rest;
          })()}/>
        </div>
      )}
    </Sidebar>
  );
};

export default SidebarDynamic;
