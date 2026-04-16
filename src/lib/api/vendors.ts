import apiClient from "./client";
import type { ApiResponse, PaginatedResponse, Vendor, Product } from "../types";

export const vendorsApi = {
  getAll: (params?: Record<string, string | number>) =>
    apiClient.get<PaginatedResponse<Vendor>>("/vendors", { params }),

  getById: (id: number | string) =>
    apiClient.get<ApiResponse<Vendor>>(`/vendors/${id}`),

  getProducts: (id: number | string, params?: Record<string, string | number>) =>
    apiClient.get<PaginatedResponse<Product>>(`/vendors/${id}/products`, {
      params,
    }),
};
