import apiClient from "./client";
import type { ApiResponse, Banner } from "../types";

export const bannersApi = {
  getAll: (params?: Record<string, string | number>) =>
    apiClient.get<ApiResponse<Banner[]>>("/banners", { params }),
};
