import apiClient from "./client";
import type { ApiResponse, Cart } from "../types";

export interface CartDeliveryOption {
  type: "self" | "company";
  id: string;
  delivery_company_id: number | null;
  name: string | null;
  name_en: string | null;
  logo: string | null;
  phone: string | null;
  price: number;
}

export interface CartDeliveryOptionsResponse {
  vendor_id: number | null;
  options: CartDeliveryOption[];
}

/**
 * Carts are scoped per vendor. The list endpoint returns one cart per shop
 * the user is currently buying from; mutating endpoints return the affected
 * vendor cart (or null when the cart was emptied and removed).
 */
export const cartApi = {
  list: () => apiClient.get<ApiResponse<Cart[]>>("/cart"),

  getForVendor: (vendorId: number) =>
    apiClient.get<ApiResponse<Cart>>(`/cart/${vendorId}`),

  addItem: (productId: number, quantity: number = 1, variantId?: number | null) =>
    apiClient.post<ApiResponse<Cart>>("/cart/items", {
      product_id: productId,
      quantity,
      ...(variantId ? { variant_id: variantId } : {}),
    }),

  updateItem: (itemId: number, quantity: number) =>
    apiClient.put<ApiResponse<Cart>>(`/cart/items/${itemId}`, { quantity }),

  updateItemVariant: (itemId: number, variantId: number) =>
    apiClient.patch<ApiResponse<Cart>>(`/cart/items/${itemId}/variant`, {
      product_variant_id: variantId,
    }),

  removeItem: (itemId: number) =>
    apiClient.delete<ApiResponse<Cart | null>>(`/cart/items/${itemId}`),

  clearVendor: (vendorId: number) =>
    apiClient.delete<ApiResponse<null>>(`/cart/${vendorId}`),

  clearAll: () => apiClient.delete<ApiResponse<null>>("/cart"),

  deliveryOptions: (
    vendorId: number,
    params: { city_id: number; area_id?: number | null },
  ) =>
    apiClient.get<ApiResponse<CartDeliveryOptionsResponse>>(
      `/cart/${vendorId}/delivery-options`,
      { params },
    ),
};

