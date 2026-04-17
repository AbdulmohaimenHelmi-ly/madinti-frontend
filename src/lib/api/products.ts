import apiClient from "./client";
import type { ApiResponse, PaginatedResponse, Product } from "../types";

export const productsApi = {
  getAll: (params?: Record<string, string | number>) =>
    apiClient.get<PaginatedResponse<Product>>("/products", { params }),

  getFeatured: (params?: Record<string, string | number>) =>
    apiClient.get<ApiResponse<Product[]>>("/products/featured", { params }),

  search: (query: string) =>
    apiClient.get<PaginatedResponse<Product>>("/products/search", {
      params: { q: query },
    }),

  getById: (id: number | string) =>
    apiClient.get<ApiResponse<Product>>(`/products/${id}`),

  getForYou: (params?: Record<string, string | number>) =>
    apiClient.get<ApiResponse<Product[]>>("/products/for-you", { params }),

  trackView: (id: number | string) =>
    apiClient.post<ApiResponse<null>>(`/products/${id}/track-view`),
};
