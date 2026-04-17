import apiClient from "./client";
import type { ApiResponse, PaginatedResponse, Product } from "../types";

type FavoriteState = {
  product_id: number;
  is_favorite: boolean;
};

export const wishlistApi = {
  list: (params?: { per_page?: number; page?: number }) =>
    apiClient.get<PaginatedResponse<Product>>("/wishlist", { params }),

  ids: () =>
    apiClient.get<ApiResponse<{ ids: number[] }>>("/wishlist/ids"),

  add: (productId: number) =>
    apiClient.post<ApiResponse<FavoriteState>>(`/wishlist/${productId}`),

  remove: (productId: number) =>
    apiClient.delete<ApiResponse<FavoriteState>>(`/wishlist/${productId}`),

  toggle: (productId: number) =>
    apiClient.post<ApiResponse<FavoriteState>>(`/wishlist/${productId}/toggle`),
};
