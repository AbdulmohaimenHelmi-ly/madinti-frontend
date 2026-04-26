import { create } from "zustand";
import type { Cart, CartItem } from "../types";
import { cartApi } from "../api/cart";

interface CartState {
  cart: Cart | null;
  isLoading: boolean;
  itemCount: number;
  fetchCart: () => Promise<void>;
  addItem: (productId: number, quantity?: number, variantId?: number | null) => Promise<void>;
  updateItem: (itemId: number, quantity: number) => Promise<void>;
  updateItemVariant: (itemId: number, variantId: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
}

function calculateItemCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

export const useCartStore = create<CartState>((set) => ({
  cart: null,
  isLoading: false,
  itemCount: 0,

  fetchCart: async () => {
    set({ isLoading: true });
    try {
      const response = await cartApi.get();
      const cart = response.data.data;
      set({
        cart,
        itemCount: calculateItemCount(cart.items),
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  addItem: async (productId, quantity = 1, variantId = null) => {
    set({ isLoading: true });
    try {
      const response = await cartApi.addItem(productId, quantity, variantId);
      const cart = response.data.data;
      set({
        cart,
        itemCount: calculateItemCount(cart.items),
        isLoading: false,
      });
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
      set({
        cart,
        itemCount: calculateItemCount(cart.items),
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  updateItemVariant: async (itemId, variantId) => {
    set({ isLoading: true });
    try {
      const response = await cartApi.updateItemVariant(itemId, variantId);
      const cart = response.data.data;
      set({
        cart,
        itemCount: calculateItemCount(cart.items),
        isLoading: false,
      });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  removeItem: async (itemId) => {
    set({ isLoading: true });
    try {
      const response = await cartApi.removeItem(itemId);
      const cart = response.data.data;
      set({
        cart,
        itemCount: calculateItemCount(cart.items),
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  clearCart: async () => {
    set({ isLoading: true });
    try {
      await cartApi.clear();
      set({ cart: null, itemCount: 0, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },
}));
