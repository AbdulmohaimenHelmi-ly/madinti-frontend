import apiClient from "./client";
import type { ApiResponse, PaginatedResponse, Product } from "../types";

export const productsApi = {
  getAll: (params?: Record<string, string | number>) =>
    apiClient.get<PaginatedResponse<Product>>("/products", { params }),

  getFeatured: () =>
    apiClient.get<ApiResponse<Product[]>>("/products/featured"),

  search: (query: string) =>
    apiClient.get<PaginatedResponse<Product>>("/products/search", {
      params: { q: query },
    }),

  getById: (id: number | string) =>
    apiClient.get<ApiResponse<Product>>(`/products/${id}`),
};
