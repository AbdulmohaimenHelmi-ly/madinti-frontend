import apiClient from "./client";
import type { ApiResponse, Cart } from "../types";

export const cartApi = {
  get: () => apiClient.get<ApiResponse<Cart>>("/cart"),

  addItem: (productId: number, quantity: number = 1, variantId?: number | null) =>
    apiClient.post<ApiResponse<Cart>>("/cart/items", {
      product_id: productId,
      quantity,
      ...(variantId ? { variant_id: variantId } : {}),
    }),

  updateItem: (itemId: number, quantity: number) =>
    apiClient.put<ApiResponse<Cart>>(`/cart/items/${itemId}`, { quantity }),

  removeItem: (itemId: number) =>
    apiClient.delete<ApiResponse<Cart>>(`/cart/items/${itemId}`),

  clear: () => apiClient.delete<ApiResponse<null>>("/cart"),
};
