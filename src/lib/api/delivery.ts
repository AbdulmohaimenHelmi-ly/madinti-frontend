import apiClient from "./client";
import type { ApiResponse, PaginatedResponse } from "../types";

export interface DeliveryPrice {
  id: number;
  delivery_company_id: number;
  city_id: number;
  area_id: number | null;
  price: number;
  city?: { id: number; name: string; name_en?: string | null };
  area?: { id: number; name: string; name_en?: string | null } | null;
}

export interface DeliveryCompany {
  id: number;
  user_id: number;
  name: string;
  name_en?: string | null;
  slug: string;
  description?: string | null;
  description_en?: string | null;
  logo?: string | null;
  phone?: string | null;
  email?: string | null;
  is_active: boolean;
  base_price: number;
  prices_count?: number;
  prices?: DeliveryPrice[];
  created_at?: string;
}

export interface DeliveryDashboardPayload {
  company: DeliveryCompany;
  stats: {
    prices_count: number;
    cities_covered: number;
    vendors_count: number;
  };
}

export const deliveryApi = {
  // ---------- Public ----------
  list: () =>
    apiClient.get<ApiResponse<DeliveryCompany[]>>("/delivery-companies"),

  get: (id: number | string) =>
    apiClient.get<ApiResponse<DeliveryCompany>>(`/delivery-companies/${id}`),

  quote: (
    id: number | string,
    params: { city_id: number; area_id?: number | null }
  ) =>
    apiClient.get<
      ApiResponse<{
        delivery_company_id: number;
        city_id: number;
        area_id: number | null;
        price: number;
      }>
    >(`/delivery-companies/${id}/quote`, { params }),

  // ---------- Delivery dashboard ----------
  dashboard: () =>
    apiClient.get<ApiResponse<DeliveryDashboardPayload>>("/delivery/dashboard"),

  myCompany: () =>
    apiClient.get<ApiResponse<DeliveryCompany>>("/delivery/company"),

  updateCompany: (data: Partial<DeliveryCompany>) =>
    apiClient.put<ApiResponse<DeliveryCompany>>("/delivery/company", data),

  prices: () =>
    apiClient.get<ApiResponse<DeliveryPrice[]>>("/delivery/prices"),

  addPrice: (data: { city_id: number; area_id?: number | null; price: number }) =>
    apiClient.post<ApiResponse<DeliveryPrice>>("/delivery/prices", data),

  updatePrice: (
    id: number,
    data: Partial<{ city_id: number; area_id: number | null; price: number }>
  ) => apiClient.put<ApiResponse<DeliveryPrice>>(`/delivery/prices/${id}`, data),

  deletePrice: (id: number) =>
    apiClient.delete<ApiResponse<null>>(`/delivery/prices/${id}`),

  // ---------- Vendor side ----------
  vendorTrustedIds: () =>
    apiClient.get<ApiResponse<{ delivery_company_ids: number[] }>>(
      "/vendor/delivery-companies"
    ),

  vendorSyncTrusted: (ids: number[]) =>
    apiClient.put<ApiResponse<{ delivery_company_ids: number[] }>>(
      "/vendor/delivery-companies",
      { delivery_company_ids: ids }
    ),

  // ---------- Admin ----------
  adminList: () =>
    apiClient.get<PaginatedResponse<DeliveryCompany>>("/admin/delivery-companies"),

  adminCreate: (data: {
    name: string;
    name_en?: string;
    description?: string;
    description_en?: string;
    phone?: string;
    email: string;
    password: string;
    base_price?: number;
  }) =>
    apiClient.post<ApiResponse<DeliveryCompany>>("/admin/delivery-companies", data),

  adminToggleActive: (id: number) =>
    apiClient.post<ApiResponse<DeliveryCompany>>(
      `/admin/delivery-companies/${id}/toggle-active`
    ),
};
