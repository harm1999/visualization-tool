import { recomputePositions } from "./layoutCalculator"

export const repositionNodes = (nodes, anchor) => {
    const root = nodes.filter(node => node.isRoot)[0]

    const repositions = recomputePositions(nodes, root)

    if (anchor) {
        const diff = {
        x: repositions[anchor.id()].x - anchor.position().x,
        y: repositions[anchor.id()].y - anchor.position().y
        };

        nodes.forEach(node => {node.position = {
            x: repositions[node.id].x - diff.x,
            y: repositions[node.id].y - diff.y
        }})
    }

}