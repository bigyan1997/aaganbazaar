import { create } from "zustand";
import { persist } from "zustand/middleware";

const MAX_COMPARE = 4;

// Product slugs only (not full product objects) - ComparePage fetches
// current data for each, so the list never goes stale while sitting in
// localStorage across visits.
const useCompareStore = create(
  persist(
    (set, get) => ({
      slugs: [],

      isCompared: (slug) => get().slugs.includes(slug),

      toggle: (slug) => {
        const { slugs } = get();
        if (slugs.includes(slug)) {
          set({ slugs: slugs.filter((s) => s !== slug) });
        } else if (slugs.length < MAX_COMPARE) {
          set({ slugs: [...slugs, slug] });
        }
      },

      remove: (slug) => set((state) => ({ slugs: state.slugs.filter((s) => s !== slug) })),
      clear: () => set({ slugs: [] }),
    }),
    { name: "aaganbazaar-compare" },
  ),
);

export { MAX_COMPARE };
export default useCompareStore;
