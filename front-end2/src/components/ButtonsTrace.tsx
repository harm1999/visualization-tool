import Button from "./elements/Button"
import { useTreeStore } from "@/data/treeStore";
import ContextMenu from "./ContextMenu";
import { generateDescription } from "@/utils/apiHelper";

const ButtonsTrace = ({ getTree, selected, hideChildren, getAncestors }) => {

  const { nodes, selectedTrace, cy } = useTreeStore();

  

  return (
    <div className="grid grid-cols-2 gap-2 mb-5">
      {selected && 
        !selected.data('status').childless &&
        ( <Button
            // onClick={() => getTree([...cy.nodes().filter(':parent').map(item=> item.data("id")), selectedNode.data("id")], selectedTrace)}
            onClick={getTree}
          >
            Show children
          </Button>)
      }
      {selected && cy.getElementById(selected.id()).outgoers().length > 0 && (
          <Button
            onClick={hideChildren}
          >
            Hide children
          </Button>
      )

      }
      {selected && !selected.data('status').childless && (
          <Button
            onClick={getAncestors}
          >
            Show ancestors
          </Button>
      )

      }
      <Button
        onClick={() => generateDescription(selected, selectedTrace)}
      >
        Generate description
      </Button>
    </div>
  );
};

export default ButtonsTrace;
