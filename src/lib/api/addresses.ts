import apiClient from "./client";
import type { ApiResponse } from "../types";

export interface UserAddress {
  id: number;
  user_id: number;
  label: string | null;
  full_name: string;
  phone: string;
  city_id: number;
  area_id: number | null;
  address: string;
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
  is_default: boolean;
  city?: { id: number; name: string; name_en?: string | null } | null;
  area?: { id: number; name: string; name_en?: string | null } | null;
}

export interface UserAddressPayload {
  label?: string | null;
  full_name: string;
  phone: string;
  city_id: number;
  area_id?: number | null;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  notes?: string | null;
  is_default?: boolean;
}

export const addressesApi = {
  list: () => apiClient.get<ApiResponse<UserAddress[]>>("/addresses"),
  create: (data: UserAddressPayload) =>
    apiClient.post<ApiResponse<UserAddress>>("/addresses", data),
  update: (id: number, data: UserAddressPayload) =>
    apiClient.put<ApiResponse<UserAddress>>(`/addresses/${id}`, data),
  remove: (id: number) =>
    apiClient.delete<ApiResponse<null>>(`/addresses/${id}`),
  setDefault: (id: number) =>
    apiClient.post<ApiResponse<UserAddress>>(`/addresses/${id}/default`),
};
