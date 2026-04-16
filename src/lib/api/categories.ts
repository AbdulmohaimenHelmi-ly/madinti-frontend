import apiClient from "./client";
import type { ApiResponse, Category, PaginatedResponse, Product } from "../types";

export const categoriesApi = {
  getAll: () => apiClient.get<ApiResponse<Category[]>>("/categories"),

  getTree: () => apiClient.get<ApiResponse<Category[]>>("/categories/tree"),

  getById: (id: number | string) =>
    apiClient.get<ApiResponse<Category>>(`/categories/${id}`),

  getProducts: (id: number | string, params?: Record<string, string | number>) =>
    apiClient.get<PaginatedResponse<Product>>(`/categories/${id}/products`, {
      params,
    }),
};
