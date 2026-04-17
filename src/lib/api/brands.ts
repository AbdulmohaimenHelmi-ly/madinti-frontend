import apiClient from "./client";
import type { ApiResponse, Brand } from "../types";

export const brandsApi = {
  getAll: (params?: Record<string, string | number>) =>
    apiClient.get<ApiResponse<Brand[]>>("/brands", { params }),

  getById: (id: number | string) =>
    apiClient.get<ApiResponse<Brand>>(`/brands/${id}`),
};
