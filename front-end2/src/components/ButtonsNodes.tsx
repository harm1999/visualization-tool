import Button from "./elements/Button"
import { getDescendants,collapseChildren, hideNode, getChildren, getSurroundings } from "../utils/apiHelper"
import { useCytoscapeStore } from "../data/store";
import { useTreeStore } from "../data/treeStore";

interface ButtonsNodesProps {
  selectedNode: any;
  disableToolbar: (value: boolean) => void;
}

const ButtonsNodes: React.FC<ButtonsNodesProps> = ({ selectedNode, disableToolbar=null }) => {
  const id = selectedNode?.data("id");
  const { styleDisabledEdges } = useCytoscapeStore();


  const { selectedTrace  } = useTreeStore();
  // wrap each handler to first call your API helper, then disable view
  const withDisable =
    (fn: () => void) =>
    () => {
      fn();
      if (disableToolbar) disableToolbar(false);
    };


    return (
      <div className="grid grid-cols-2 gap-2 mb-5">
        {selectedNode && selectedNode.isChildless() ? (
          <Button
            onClick={withDisable(() =>
              getSurroundings(id, styleDisabledEdges, selectedTrace != "None" ? selectedTrace : null)
            )}
            className="whitespace-normal text-center"
          >
            Show dependencies
          </Button>
        ) : (
          <Button
            onClick={withDisable(() =>
              collapseChildren(id)
            )}
            className="whitespace-normal text-center"
          >
            Collapse children
          </Button>
        )}
        <Button
          onClick={withDisable(() =>
            getDescendants(id)
          )}
          className="whitespace-normal text-center"
        >
          Show descendants
        </Button>
        <Button
          onClick={withDisable(() =>
            hideNode(id)
          )}
          className="whitespace-normal text-center"
        >
          Hide
        </Button>
        {selectedNode?.data('node')?.labels?.includes("Container") && (<Button
          onClick={withDisable(() =>
            getChildren(id, false)
          )}
          className="whitespace-normal text-center"
        >
          Show children
        </Button>)}
      </div>
  );
};

export default ButtonsNodes;
