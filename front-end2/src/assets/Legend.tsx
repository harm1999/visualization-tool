import { LAYER_COLORS, role_stereotype_colors } from "../styles/constants";

interface LegendProps {
  dynamicView: boolean;
}

const Legend: React.FC<LegendProps> = ({ dynamicView }) => {


    return (
        <div id="legend" className="absolute top-2 left-2 bg-white bg-opacity-90 p-2 rounded shadow-md text-xs text-black">
            <h4 className="text-sm font-semibold mb-4">{dynamicView ? "Dynamic" : "Static"} View: Node Legend</h4>
            <ul className="space-y-3">
            {dynamicView && (
            <>
                <li className="flex items-center">
                <svg
                    className="w-5 h-5 mr-3"
                    viewBox="0 0 20 20"
                    fill={LAYER_COLORS.get("ROOT")}
                    stroke="currentColor"
                    strokeWidth="3"
                >
                    <circle cx="10" cy="10" r="9" />
                </svg>
                <span className="text-xs">Root</span>
                </li>
                <li className="flex items-center">
                <svg
                    className="w-5 h-5 mr-3"
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                >
                    <circle cx="10" cy="10" r="9" />
                </svg>
                <span className="text-xs">Has Children</span>
                </li>
                <li className="flex items-center">
                <svg
                    className="w-5 h-5 mr-3"
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                >
                    <circle cx="10" cy="10" r="9" />
                </svg>
                <span className="text-xs">Leaf</span>
                </li>
            </>
            )}

                {Object.entries(role_stereotype_colors).filter(([key, _]) => !["-", "*"].includes(key)).map(([key, value]) => (
                <li key={key} className="flex items-center">
                    <svg
                    className="w-5 h-5 mr-3"
                    viewBox="0 0 20 20"
                    fill={`hsl(${value.h}, ${value.s*100}%, ${value.l*100}%)`}
                    stroke="currentColor"
                    strokeWidth={1}
                    >
                    <circle cx="10" cy="10" r="9" />
                    </svg>
                    <span className="text-xs">{key}</span>
                </li>
                ))}


            </ul>
        </div>

    )
}

export default Legend