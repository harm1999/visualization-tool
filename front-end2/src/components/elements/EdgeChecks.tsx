import { useCytoscapeStore } from '../../data/store';

const EdgeChecks = () => {
    // const [edgeTypes, setEdgeTypes] = useState({});
    
    const edgeTypes = useCytoscapeStore(state => state.edgeTypes)
    const toggleEdgeType = useCytoscapeStore(state => state.toggleEdgeType)
    
    // if (Object.keys(edgeTypes).length == 0) getEdgeTypes()
    
    return (
        <div>
            <h2 className="text-sm font-semibold mb-2 w-full">Edge types</h2>
            <ul className="mt-2 space-y-1">
            {Object.entries(edgeTypes).map(([edge, enabled]) => (
                <li key={edge} className="flex items-center justify-between p-2 rounded">
                <div className="flex items-center">
                    <input
                    id={edge}
                    type="checkbox"
                    checked={enabled}
                    onChange={() => toggleEdgeType(edge)}
                    className="h-4 w-4 form-checkbox accent-gray-500 focus:ring-0"
                    />
                    <label
                    htmlFor={edge}
                    className="ml-2 text-xs cursor-pointer select-none"
                    >
                    {edge}
                    </label>
                </div>
                </li>
            ))}
            </ul>
        </div>


    )

}

export default EdgeChecks;