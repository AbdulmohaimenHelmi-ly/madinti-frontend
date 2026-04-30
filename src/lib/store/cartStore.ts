import { create } from "zustand";
import type { Cart } from "../types";
import { cartApi } from "../api/cart";

/**
 * Per-vendor cart store. The user has one cart per shop they're buying from
 * (mirroring how orders are scoped). Mutating endpoints return the affected
 * vendor cart, which is patched into the local list; if the cart was emptied
 * server-side the entry is dropped so vendor sections never linger empty.
 */
interface CartState {
  carts: Cart[];
  isLoading: boolean;
  itemCount: number;
  fetchCarts: () => Promise<void>;
  getCartForVendor: (vendorId: number) => Cart | undefined;
  addItem: (
    productId: number,
    quantity?: number,
    variantId?: number | null,
  ) => Promise<Cart | null>;
  updateItem: (itemId: number, quantity: number) => Promise<void>;
  updateItemVariant: (itemId: number, variantId: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  clearVendorCart: (vendorId: number) => Promise<void>;
  clearAllCarts: () => Promise<void>;
  reset: () => void;
}

const sumItems = (carts: Cart[]): number =>
  carts.reduce(
    (total, cart) => total + cart.items.reduce((s, i) => s + i.quantity, 0),
    0,
  );

const upsertCart = (carts: Cart[], next: Cart | null, fallbackId?: number): Cart[] => {
  if (!next) {
    if (fallbackId == null) return carts;
    return carts.filter((c) => c.id !== fallbackId);
  }
  const others = carts.filter((c) => c.vendor_id !== next.vendor_id);
  return [next, ...others];
};

export const useCartStore = create<CartState>((set, get) => ({
  carts: [],
  isLoading: false,
  itemCount: 0,

  fetchCarts: async () => {
    set({ isLoading: true });
    try {
      const response = await cartApi.list();
      const carts = response.data.data ?? [];
      set({ carts, itemCount: sumItems(carts), isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  getCartForVendor: (vendorId) =>
    get().carts.find((c) => c.vendor_id === vendorId),

  addItem: async (productId, quantity = 1, variantId = null) => {
    set({ isLoading: true });
    try {
      const response = await cartApi.addItem(productId, quantity, variantId);
      const cart = response.data.data;
      const carts = upsertCart(get().carts, cart);
      set({ carts, itemCount: sumItems(carts), isLoading: false });
      return cart;
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  updateItem: async (itemId, quantity) => {
    set({ isLoading: true });
    try {
      const response = await cartApi.updateItem(itemId, quantity);
      const cart = response.data.data;
      const carts = upsertCart(get().carts, cart);
      set({ carts, itemCount: sumItems(carts), isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  updateItemVariant: async (itemId, variantId) => {
    set({ isLoading: true });
    try {
      const response = await cartApi.updateItemVariant(itemId, variantId);
      const cart = response.data.data;
      const carts = upsertCart(get().carts, cart);
      set({ carts, itemCount: sumItems(carts), isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  removeItem: async (itemId) => {
    // Track which cart owned the item so we can drop it locally if the
    // server emptied (and deleted) the cart and returns null.
    const previousCart = get().carts.find((c) =>
      c.items.some((i) => i.id === itemId),
    );
    set({ isLoading: true });
    try {
      const response = await cartApi.removeItem(itemId);
      const cart = response.data.data;
      const carts = upsertCart(get().carts, cart, previousCart?.id);
      set({ carts, itemCount: sumItems(carts), isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  clearVendorCart: async (vendorId) => {
    set({ isLoading: true });
    try {
      await cartApi.clearVendor(vendorId);
      const carts = get().carts.filter((c) => c.vendor_id !== vendorId);
      set({ carts, itemCount: sumItems(carts), isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  clearAllCarts: async () => {
    set({ isLoading: true });
    try {
      await cartApi.clearAll();
      set({ carts: [], itemCount: 0, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  reset: () => set({ carts: [], itemCount: 0, isLoading: false }),
}));

