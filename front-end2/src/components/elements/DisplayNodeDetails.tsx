import CollapsibleSection from "./CollapsibleSection"
import DisplayFunctionDetails from "./DisplayFunctionDetails";

const DisplayNodeDetails = ({ title, node }) => {
    function splitByCh(str, pattern) {
      return str.replace(pattern, match => "\u200b" + match);
    }

    if (!node?.properties) return;

    const order = [
      {value: node?.properties?.qualifiedName, text: 'Full name'},
      {value: node?.properties?.title, text: 'Title'},
      {value: node?.properties?.keywords, text: 'Keywords'},
      {value: node?.properties?.description, text: "Description"},
      {value: node?.properties?.roleStereotype, text: "Role stereotype"},
      {value: node?.properties?.roleStereotypeReason, text: "Reason"},
      {value: node?.properties?.layer, text: "Layer"},
      {value: node?.properties?.layerReason, text: "Reason"}
    ]

    return (
      <div>
        <h2 className="text-lg font-semibold ml-2 mb-4 break-words border-b-1">{splitByCh(node.properties.simpleName, /\./g)}</h2>
        <CollapsibleSection title={title} level={2}>
          {order.filter(item => item.value).map((item, idx) => (
            <CollapsibleSection key={idx} title={item.text} level = {3}>
              <div className="text-xs p-1 rounded whitespace-normal break-words">
                {String(item.value).replace(/,(?!\s)/g, ", ")}
              </div>
            </CollapsibleSection>
            
          ))}

          {node.functions && node.functions.length > 0 && (
            <CollapsibleSection title="Functions" level={2}>
              {node.functions.map((item, idx) => (
                <DisplayFunctionDetails key={idx} level={3} node={item}/>
              ))}
            </CollapsibleSection>
          )}
        </CollapsibleSection>
      </div>
    )
}

export default DisplayNodeDetails;