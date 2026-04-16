import apiClient from "./client";
import type { ApiResponse, PaginatedResponse } from "../types";

export interface VendorApplication {
  id: number;
  user_id: number;
  store_name: string;
  store_name_en: string | null;
  description: string | null;
  phone: string | null;
  city: string | null;
  city_id: number | null;
  area_id: number | null;
  city_details?: { id: number; name: string } | null;
  area_details?: { id: number; name: string } | null;
  address: string | null;
  status: "pending" | "approved" | "rejected";
  admin_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
  user?: {
    id: number;
    name: string;
    email: string;
    phone: string | null;
  };
}

export interface ApplyVendorPayload {
  store_name: string;
  store_name_en?: string;
  description?: string;
  phone?: string;
  city?: string;
  city_id?: number | null;
  area_id?: number | null;
  address?: string;
}

export const vendorApplicationsApi = {
  // customer
  getMine: () =>
    apiClient.get<ApiResponse<VendorApplication | null>>(
      "/vendor-applications/me"
    ),
  apply: (data: ApplyVendorPayload) =>
    apiClient.post<ApiResponse<VendorApplication>>("/vendor-applications", data),

  // admin
  list: (params?: Record<string, string | number>) =>
    apiClient.get<PaginatedResponse<VendorApplication>>(
      "/admin/vendor-applications",
      { params }
    ),
  approve: (id: number, admin_notes?: string) =>
    apiClient.post<ApiResponse<VendorApplication>>(
      `/admin/vendor-applications/${id}/approve`,
      { admin_notes }
    ),
  reject: (id: number, admin_notes?: string) =>
    apiClient.post<ApiResponse<VendorApplication>>(
      `/admin/vendor-applications/${id}/reject`,
      { admin_notes }
    ),
};
