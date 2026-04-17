import apiClient from "./client";
import type {
  ApiResponse,
  Order,
  PaginatedResponse,
  Product,
  Vendor,
} from "../types";

export interface VendorDashboardPayload {
  vendor: Vendor;
  total_products: number;
  total_orders: number;
  total_sales: number;
  rating: number;
}

export const vendorApi = {
  getDashboard: () =>
    apiClient.get<ApiResponse<VendorDashboardPayload>>("/vendor/dashboard"),

  getProducts: (params?: Record<string, string | number>) =>
    apiClient.get<PaginatedResponse<Product>>("/vendor/products", { params }),

  getOrders: (params?: Record<string, string | number>) =>
    apiClient.get<PaginatedResponse<Order>>("/vendor/orders", { params }),

  updateOrderStatus: (orderId: number | string, status: string) =>
    apiClient.put<ApiResponse<Order>>(`/vendor/orders/${orderId}/status`, {
      status,
    }),
};
