import { LAYER_COLORS } from './constants';

/**
 * Get Cytoscape styles for the graph
 * @param {number} nodeSize - Base size for nodes
 * @return {Array} Array of style objects
 */
export function getCytoscapeStyles(nodeSize) {
  return [
    // 基本節點樣式 - 普通方法節點
    {
      selector: 'node',
      style: {
        'background-color': function(ele) {
          return ele.data('color') ?? "grey"; // 保留顏色表示package
        },
        'label': 'data(label)',
        'background-opacity': 0.85,
        // 'width': (node:any) => { console.log("EEGE"); return node.data('label').length * 4 },
        'width': nodeSize,
        'height': nodeSize,
        'shape': 'ellipse',
        'border-width': 1,
        'border-color': '#333',
        'text-valign': 'center',
        'text-halign': 'center',
        'text-wrap': 'wrap',
        'text-max-width': nodeSize
      }
    },

    // 特殊節點共用樣式
    {
      selector: 'node[?status.recursiveEntryPoint], node[?status.implementationEntryPoint], node[?status.fanOut]',
      style: {
        'border-color': '#000',
        'background-opacity': 0.95,
      }
    },

    // Fan Out節點 - 使用星形
    {
      selector: 'node[?isRoot]',
      style: {
        'shape': 'star', // 改為星形，更加突出
        'z-index': 10
      }
    },
    {
      selector: 'node[!status.childless]',
      style: {
        'border-width': 5
      }
    },

    // 根節點樣式
    {
      selector: 'node[?isRoot]',
      style: {
        'background-color': LAYER_COLORS.get('ROOT'),
        'background-opacity': 1,
        'shape': 'ellipse',
        // 'border-width': 3.5,
        'border-color': '#000',
        'z-index': 20
      }
    },

    // 邊緣樣式
    {
      selector: 'edge',
      style: {
        'width': function(ele) {
          return ele.data('callCount') ? 
                 Math.min(1 + ele.data('callCount') * 0.3, 3) : 1;
        },
        'line-color': '#aaa',
        'target-arrow-color': '#aaa',
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier',
        'opacity': 0.85
      }
    },

    // 選中節點樣式
    {
      selector: '.selected',
      style: {
        // 'border-width': 4,
        'border-color': '#FFC107',
        'border-opacity': 1,
        'z-index': 999
      }
    },

    // 選中節點的相鄰邊
    {
      selector: '.selected-edge',
      style: {
        'width': 2.5,
        'line-color': '#FFC107',
        'target-arrow-color': '#FFC107',
        'opacity': 1,
        'z-index': 900
      }
    }
  ];
}