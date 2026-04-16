import apiClient from "./client";
import type { ApiResponse, PaginatedResponse, Review } from "../types";

export const reviewsApi = {
  getByProduct: (
    productId: number | string,
    params?: Record<string, string | number>
  ) =>
    apiClient.get<PaginatedResponse<Review>>(`/products/${productId}/reviews`, {
      params,
    }),

  create: (
    productId: number | string,
    data: { rating: number; comment?: string }
  ) =>
    apiClient.post<ApiResponse<Review>>(
      `/products/${productId}/reviews`,
      data
    ),
};
