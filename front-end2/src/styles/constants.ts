export const role_stereotype_colors = {
	"Controller": { h: 294, s: 0.38, l: 0.42 },
	"Coordinator": { h: 115, s: 0.4, l: 0.47 },
	"Information Holder": { h: 359, s: 0.78, l: 0.54 },
	"Interfacer": { h: 45, s: 1, l: 0.33 },
	"User Interfacer": { h: 45, s: 1, l: 0.33 },
	"Internal Interfacer": { h: 45, s: 1, l: 0.33 },
	"External Interfacer": { h: 45, s: 1, l: 0.33 },
	"Service Provider": { h: 216, s: 0.49, l: 0.5 },
	"Structurer": { h: 321, s: 1, l: 0.75 },
	"*": { h: 0, s: 0, l: 0.5 },
	"-": { h: 0, s: 0, l: 0.5 },
  "Creational":         { h: 170, s: 0.65, l: 0.50 }
};


export const layer_colors = {
    "Presentation Layer": { h: 294, s: 0.38, l: 0.42 },
    "Service Layer": { h: 115, s: 0.4, l: 0.47 },
    "Domain Layer": { h: 359, s: 0.78, l: 0.54 },
    "Data Source Layer": { h: 45, s: 1, l: 0.33 }
};

/**
 * Constants for layout configuration and visual styling
 */
export const LAYOUT = {
    NODE_SIZE: 100,
    VERTICAL_SPACING: 170,
    HORIZONTAL_SPACING: 20
  };

  /**
   * Color maps for different visualization schemes
   */
  export const LAYER_COLORS = new Map([
    ['UI', 'hsl(333, 70%, 50%)'],
    ['Logic', 'hsl(39, 96%, 49%)'],
    ['Data', 'hsl(143, 74%, 49%)'],
    ['Domain', 'hsl(261, 41.8%, 78.4%)'],
    ['Presentation Layer', '#FF0000'],
    ['Undefined', '#4299E1'],
    ['ROOT', '#6B46C1']  // Dark purple for root
  ]);
  
  export const PACKAGE_COLORS = new Map([
    ['nl.tudelft.jpacman', '#2C7A7B'],           // Teal
    ['nl.tudelft.jpacman.board', '#3182CE'],     // Blue
    ['nl.tudelft.jpacman.game', '#DD6B20'],      // Orange
    ['nl.tudelft.jpacman.level', '#38A169'],     // Green
    ['nl.tudelft.jpacman.npc', '#D53F8C'],       // Pink
    ['nl.tudelft.jpacman.npc.ghost', '#718096'], // Gray
    ['nl.tudelft.jpacman.points', '#ECC94B'],    // Yellow
    ['nl.tudelft.jpacman.sprite', '#805AD5'],    // Purple
    ['nl.tudelft.jpacman.ui', '#E53E3E'],        // Red
    ['ROOT', '#6B46C1']                          // Dark purple for root
  ]);
  
  /**
   * Gets the color for a specific layer
   * @param {string} layer - The layer name
   * @param {boolean} isRoot - Whether this is the root node
   * @return {string} The color code
   */
  export function getLayerColor(layer, isRoot = false) {
    if (isRoot) return LAYER_COLORS.get('ROOT');
    return LAYER_COLORS.get(layer) || '#A0AEC0';
  }
  
  /**
   * Gets the color for a specific package
   * @param {string} packageName - The package name
   * @param {boolean} isRoot - Whether this is the root node
   * @return {string} The color code
   */
  export function getPackageColor(packageName, isRoot) {
    if (isRoot) return PACKAGE_COLORS.get('ROOT');
    return PACKAGE_COLORS.get(packageName) || '#A0AEC0';
  }
  