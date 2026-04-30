import apiClient from "./client";
import type { ApiResponse, PaginatedResponse, Order } from "../types";

export interface CreateOrderData {
  vendor_id: number;
  shipping_address: string;
  shipping_city: string;
  shipping_city_id?: number | null;
  shipping_area_id?: number | null;
  shipping_phone: string;
  payment_method: string;
  notes?: string;
  delivery_type?: "company" | "self" | null;
  delivery_company_id?: number | null;
}

export const ordersApi = {
  getAll: (params?: Record<string, string | number>) =>
    apiClient.get<PaginatedResponse<Order>>("/orders", { params }),

  getById: (id: number | string) =>
    apiClient.get<ApiResponse<Order>>(`/orders/${id}`),

  create: (data: CreateOrderData) =>
    apiClient.post<ApiResponse<Order>>("/orders", data),
};
