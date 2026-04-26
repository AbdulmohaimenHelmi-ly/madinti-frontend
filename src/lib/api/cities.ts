import apiClient from "./client";
import type { ApiResponse } from "../types";

export interface City {
  id: number;
  name: string;
  name_ar?: string;
  name_en: string | null;
  latitude?: number | null;
  longitude?: number | null;
  is_active: boolean;
  sort_order: number;
  areas?: Area[];
  areas_count?: number;
}

export interface Area {
  id: number;
  city_id: number;
  name: string;
  name_ar?: string;
  name_en: string | null;
  latitude?: number | null;
  longitude?: number | null;
  is_active: boolean;
  sort_order: number;
}

export interface CityPayload {
  name: string;
  name_en?: string;
  latitude?: number | null;
  longitude?: number | null;
  is_active?: boolean;
  sort_order?: number;
}

export interface AreaPayload {
  name: string;
  name_en?: string;
  latitude?: number | null;
  longitude?: number | null;
  is_active?: boolean;
  sort_order?: number;
}

export const citiesApi = {
  // public
  list: (params?: { with_areas?: boolean; all?: boolean }) =>
    apiClient.get<ApiResponse<City[]>>("/cities", { params }),
  areasOf: (cityId: number, params?: { all?: boolean }) =>
    apiClient.get<ApiResponse<Area[]>>(`/cities/${cityId}/areas`, { params }),

  // admin
  create: (data: CityPayload) =>
    apiClient.post<ApiResponse<City>>("/admin/cities", data),
  update: (id: number, data: Partial<CityPayload>) =>
    apiClient.put<ApiResponse<City>>(`/admin/cities/${id}`, data),
  remove: (id: number) =>
    apiClient.delete<ApiResponse<null>>(`/admin/cities/${id}`),
  createArea: (cityId: number, data: AreaPayload) =>
    apiClient.post<ApiResponse<Area>>(`/admin/cities/${cityId}/areas`, data),
  updateArea: (areaId: number, data: Partial<AreaPayload>) =>
    apiClient.put<ApiResponse<Area>>(`/admin/areas/${areaId}`, data),
  removeArea: (areaId: number) =>
    apiClient.delete<ApiResponse<null>>(`/admin/areas/${areaId}`),
};
