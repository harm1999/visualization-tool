import { LAYOUT } from "../styles/constants";

export const cyCalculateSubtreeWidth = (nodes, node) => {
  const childNodes = getChildren(nodes, node);
  
  if (childNodes.length === 0) {
    return LAYOUT.NODE_SIZE;  // Base width for a leaf node
  }

  let totalWidth = 0;
  for (const child of childNodes) {
    totalWidth += cyCalculateSubtreeWidth(nodes, child);
  }

  // Add spacing between children
  if (childNodes.length > 1) {
    totalWidth += (childNodes.length - 1) * LAYOUT.HORIZONTAL_SPACING;
  }

  return Math.max(LAYOUT.NODE_SIZE, totalWidth);
};

/**
 * Calculate the horizontal position for a node
 * @param {Element} xmlNode - The XML node
 * @param {Function} shouldIncludeNode - Function to determine if a node should be included
 * @param {number} leftBound - Left boundary for positioning
 * @param {Array} childNodes - Array of child nodes
 * @return {number} The calculated x position
 */
export const calculateNodeXPosition = (xmlNode, leftBound, childNodes) => {
  const subtreeWidth = calculateSubtreeWidth(xmlNode);
  return childNodes.length === 0
    ? leftBound + LAYOUT.NODE_SIZE / 2  // Center of leaf node
    : leftBound + subtreeWidth / 2;     // Center of subtree
};

export const cyCalculateNodeXPosition = (nodes, node, leftBound) => {
  const subtreeWidth = cyCalculateSubtreeWidth(nodes, node);
  return getChildren(nodes, node).length === 0
    ? leftBound + LAYOUT.NODE_SIZE / 2  // Center of leaf node
    : leftBound + subtreeWidth / 2;     // Center of subtree
};

/**
 * Calculate the vertical position for a node
 * @param {number} depth - The depth level of the node in the tree
 * @return {number} The calculated y position
 */
export const calculateNodeYPosition = (depth) => {
  return depth * LAYOUT.VERTICAL_SPACING;
};

/**
 * Calculate node position
 * @param {Element} xmlNode - The XML node
 * @param {number} depth - Current depth in the tree
 * @param {number} leftBound - Left boundary for positioning
 * @param {Array} childNodes - Array of child nodes
 * @return {Object} The position coordinates {x, y}
 */
export const calculateNodePosition = (xmlNode, depth, leftBound, childNodes) => {
  const x = calculateNodeXPosition(xmlNode, leftBound, childNodes);
  const y = calculateNodeYPosition(depth);
  return { x, y };
};

export const cyCalculateNodePosition = (nodes, node, depth, leftBound) => {
  const x = cyCalculateNodeXPosition(nodes, node, leftBound);
  const y = calculateNodeYPosition(depth);
  return { x, y };
};

/**
 * Calculate layout positions for all children
 * @param {Array} childNodes - Array of child nodes
 * @param {number} leftBound - Left boundary for positioning
 * @return {Array} Array of objects containing node and its right boundary position
 */
export const calculateChildrenLayouts = (childNodes, leftBound) => {
  let currentX = leftBound;
  const childLayouts = [];

  for (const childNode of childNodes) {
    const childSubtreeWidth = calculateSubtreeWidth(childNode);
    
    childLayouts.push({
      node: childNode,
      startX: currentX,
      width: childSubtreeWidth
    });
    
    currentX += childSubtreeWidth + LAYOUT.HORIZONTAL_SPACING;
  }

  return {
    childLayouts,
    finalX: currentX
  };
};

export const cyCalculateChildrenLayouts = (nodes, childNodes, leftBound) => {
  let currentX = leftBound;
  const childLayouts = [];

  for (const childNode of childNodes) {
    const childSubtreeWidth = cyCalculateSubtreeWidth(nodes, childNode);
    
    childLayouts.push({
      child: childNode,
      startX: currentX,
      width: childSubtreeWidth
    });
    
    currentX += childSubtreeWidth + LAYOUT.HORIZONTAL_SPACING;
  }

  return {
    childLayouts,
    finalX: currentX
  };
};


export const recomputePositions = (nodes, node, depth = 0, leftBound = 0, repositions={}) => {
  const position = cyCalculateNodePosition(nodes, node, depth, leftBound);

  repositions[node.id] = position

  const children = getChildren(nodes, node)

  if (children.length > 0) {
      const { childLayouts } = cyCalculateChildrenLayouts(nodes, children, leftBound);

      childLayouts.forEach(({ child, startX }) => {
        repositions = recomputePositions(nodes, child, depth + 1, startX, repositions);
      })

  }

  return repositions;
}

const getChildren = (nodes, node) => {
    return nodes.filter(item => item.data.caller == node.id);

}

export const reposition = (new_positions, nodeId = null) => {
  const cy = window.cytrace;

  if (nodeId){
    const node = cy.getElementById(nodeId);
    const anchor = node.position();
  
    const diff = {
      x: new_positions[node.id()].x - anchor.x,
      y: new_positions[node.id()].y - anchor.y
    };
  
    Object.keys(new_positions).forEach(key => new_positions[key] = {
      x: new_positions[key].x - diff.x,
      y: new_positions[key].y - diff.y,
    })
  }

  
  Object.entries(new_positions).forEach(([key, value]) => cy.getElementById(key).position(value));

}