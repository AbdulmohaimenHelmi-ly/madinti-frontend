import { create } from "zustand";
import { wishlistApi } from "../api/wishlist";

interface WishlistState {
  ids: Set<number>;
  isInitialized: boolean;
  isLoading: boolean;
  fetchIds: () => Promise<void>;
  has: (productId: number) => boolean;
  toggle: (productId: number) => Promise<boolean>;
  remove: (productId: number) => Promise<void>;
  reset: () => void;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  ids: new Set<number>(),
  isInitialized: false,
  isLoading: false,

  fetchIds: async () => {
    set({ isLoading: true });
    try {
      const response = await wishlistApi.ids();
      const ids = response.data.data?.ids ?? [];
      set({
        ids: new Set(ids),
        isInitialized: true,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false, isInitialized: true });
    }
  },

  has: (productId) => get().ids.has(productId),

  toggle: async (productId) => {
    // Optimistically flip state so the UI feels instant.
    const current = new Set(get().ids);
    const willFavorite = !current.has(productId);
    if (willFavorite) current.add(productId);
    else current.delete(productId);
    set({ ids: current });

    try {
      const response = await wishlistApi.toggle(productId);
      const isFavorite = response.data.data?.is_favorite ?? willFavorite;
      const next = new Set(get().ids);
      if (isFavorite) next.add(productId);
      else next.delete(productId);
      set({ ids: next });
      return isFavorite;
    } catch {
      // Roll back on failure.
      const rollback = new Set(get().ids);
      if (willFavorite) rollback.delete(productId);
      else rollback.add(productId);
      set({ ids: rollback });
      return !willFavorite;
    }
  },

  remove: async (productId) => {
    const next = new Set(get().ids);
    next.delete(productId);
    set({ ids: next });
    try {
      await wishlistApi.remove(productId);
    } catch {
      const rollback = new Set(get().ids);
      rollback.add(productId);
      set({ ids: rollback });
    }
  },

  reset: () => set({ ids: new Set<number>(), isInitialized: false }),
}));
