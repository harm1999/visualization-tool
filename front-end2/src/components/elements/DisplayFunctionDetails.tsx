import CollapsibleSection from "./CollapsibleSection"

const DisplayFunctionDetails = ({ level, node, defaultOpen=false }) => {
    function splitByCh(str, pattern) {
      return str.replace(pattern, match => "\u200b" + match);
    }

    const extractFunctionName = (string) => {
        const splitted = string.split(".");
        return splitted[splitted.length - 1]
    }
    if (!node) return;

    
    const Tag = `h${level + 1}`;
    const orderFunctions = (obj) => [
      {value: obj?.properties?.qualifiedName, text: 'Full name'},
      {value: obj?.properties?.description, text: "Description"},
      {value: obj?.properties?.parameters, text: "Parameters"},
      {value: obj?.properties?.returns, text: "Returns"},
      {value: obj?.properties?.howItWorks, text: "How it works"},
      {value: obj?.properties?.howToUse, text: "How to use"},
      {value: obj?.properties?.preConditions, text: "Pre conditions"},
      {value: obj?.properties?.postConditions, text: "Post conditions"},
      {value: obj?.properties?.stereotype, text: "Stereotype"},
      {value: obj?.properties?.stereotypeReason, text: "Reason"},
      {value: obj?.properties?.layer, text: "Layer"},
      {value: obj?.properties?.layerReason, text: "Reason"},
      
    ]
    
    return (

        <CollapsibleSection
            key={node.id}
            title={splitByCh(extractFunctionName(node.properties.simpleName), /[A-Z]/g)}
            level={3}
            defaultOpen={defaultOpen}
        >
            {orderFunctions(node).filter(item => item.value).map((item, idx) => (
            <CollapsibleSection title={item.text} level={3} key={idx}>
                <div className="text-xs p-1 rounded whitespace-normal break-words">
                    {item.text != 'Parameters' ? (String(item.value)) : (item.value.map((param, idx2) => (
                        <CollapsibleSection title={param.name} level={4} key={`${idx}-${idx2}`} defaultOpen={false}>
                            {Object.entries(param).map(([k, v], idx3) => (
                                <CollapsibleSection title={k} level={5} key={`${idx}-${idx2}-${idx3}`} defaultOpen={true}>
                                    <div className="text-xs p-1 rounded whitespace-normal break-words">
                                        {v}
                                    </div>
                                </CollapsibleSection>
                            ))}
                        </CollapsibleSection>
                    )))}
                </div>
                
            </CollapsibleSection>
            ))}
        </CollapsibleSection>
    )
}

export default DisplayFunctionDetails;