import apiClient from "./client";
import type {
  ApiResponse,
  Category,
  Order,
  PaginatedResponse,
  User,
  Vendor,
} from "../types";

export interface CreateCategoryPayload {
  name: string;
  name_en?: string;
  parent_id?: number | null;
  description?: string;
  description_en?: string;
  sort_order?: number;
  is_active?: boolean;
}

export interface UpdateVendorPayload {
  store_name?: string;
  store_name_en?: string;
  description?: string;
  description_en?: string;
  phone?: string;
  city?: string;
  city_id?: number | null;
  area_id?: number | null;
  is_active?: boolean;
}

export interface ImpersonateResponse {
  user: User;
  token: string;
  impersonator: User;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  phone?: string | null;
  role?: "customer" | "vendor" | "admin";
  is_active?: boolean;
}

export const adminApi = {
  // Users
  getUsers: (params?: Record<string, string | number>) =>
    apiClient.get<PaginatedResponse<User>>("/admin/users", { params }),
  getUser: (id: number) =>
    apiClient.get<ApiResponse<User>>(`/admin/users/${id}`),
  updateUser: (id: number, data: UpdateUserPayload) =>
    apiClient.put<ApiResponse<User>>(`/admin/users/${id}/admin-update`, data),
  toggleUserActive: (id: number) =>
    apiClient.post<ApiResponse<User>>(`/admin/users/${id}/toggle-active`),
  deleteUser: (id: number) =>
    apiClient.delete<ApiResponse<null>>(`/admin/users/${id}`),
  impersonateUser: (id: number) =>
    apiClient.post<ApiResponse<ImpersonateResponse>>(
      `/admin/users/${id}/impersonate`
    ),

  // Vendors
  getVendors: (params?: Record<string, string | number>) =>
    apiClient.get<PaginatedResponse<Vendor>>("/admin/vendors", { params }),
  updateVendor: (id: number, data: UpdateVendorPayload) =>
    apiClient.put<ApiResponse<Vendor>>(`/admin/vendors/${id}`, data),
  deleteVendor: (id: number) =>
    apiClient.delete<ApiResponse<null>>(`/admin/vendors/${id}`),
  activateVendor: (id: number) =>
    apiClient.post<ApiResponse<null>>(`/admin/vendors/${id}/activate`),
  deactivateVendor: (id: number) =>
    apiClient.post<ApiResponse<null>>(`/admin/vendors/${id}/deactivate`),

  // Categories
  getCategories: () =>
    apiClient.get<ApiResponse<Category[]>>("/admin/categories"),
  createCategory: (data: CreateCategoryPayload) =>
    apiClient.post<ApiResponse<Category>>("/admin/categories", data),
  updateCategory: (id: number, data: Partial<CreateCategoryPayload>) =>
    apiClient.put<ApiResponse<Category>>(`/admin/categories/${id}`, data),
  deleteCategory: (id: number) =>
    apiClient.delete<ApiResponse<null>>(`/admin/categories/${id}`),

  // Orders
  getOrders: (params?: Record<string, string | number>) =>
    apiClient.get<PaginatedResponse<Order>>("/admin/orders", { params }),
  getOrder: (id: number) =>
    apiClient.get<ApiResponse<Order>>(`/admin/orders/${id}`),
  updateOrderStatus: (id: number, status: string) =>
    apiClient.put<ApiResponse<Order>>(`/admin/orders/${id}/status`, { status }),
};
