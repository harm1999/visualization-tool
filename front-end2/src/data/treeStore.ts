import { create } from 'zustand'

export const useTreeStore = create((set, get) => ({

    nodes: [],

    selectedTrace: 'None',

    descriptions: {},
    setDescriptions: (key, html) =>
    set((state) => ({
      descriptions: { ...state.descriptions, [key]: html },
    })),

    cy: null,

    setNodes : nodes => set(() => {
        return { nodes }
    }),

    addNodes: (nodes) => set((state) => {
        // build a Map from id→node; later items with same id replace earlier
        const map = new Map(
        [...state.nodes, ...nodes].map((n) => [n.id, n])
        );
        return { nodes: Array.from(map.values()) };
    }),

    refit: () => {
        get()?.cy?.fit();
    },

    setSelectedTrace: selectedTrace => set(() => {
        return { selectedTrace }
    }),

    setCy: cy => set({ cy }),
    
}));