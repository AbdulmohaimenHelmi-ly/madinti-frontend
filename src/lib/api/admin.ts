import apiClient from "./client";
import type {
  ApiResponse,
  Banner,
  BannerPosition,
  Brand,
  Category,
  ContentType,
  Order,
  PaginatedResponse,
  ProductVariant,
  ProductVariantType,
  User,
  Variant,
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
  content_type?: ContentType;
}

export interface BrandPayload {
  name: string;
  name_en?: string | null;
  logo?: string | null;
  description?: string | null;
  description_en?: string | null;
  sort_order?: number;
  is_active?: boolean;
  is_featured?: boolean;
  content_type?: ContentType;
}

export interface BannerPayload {
  position: BannerPosition;
  title?: string | null;
  title_en?: string | null;
  subtitle?: string | null;
  subtitle_en?: string | null;
  image: string;
  link?: string | null;
  sort_order?: number;
  is_active?: boolean;
  content_type?: ContentType;
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

  // Brands
  getBrands: (params?: Record<string, string | number>) =>
    apiClient.get<ApiResponse<Brand[]>>("/admin/brands", { params }),
  getBrand: (id: number) =>
    apiClient.get<ApiResponse<Brand>>(`/admin/brands/${id}`),
  createBrand: (data: BrandPayload) =>
    apiClient.post<ApiResponse<Brand>>("/admin/brands", data),
  updateBrand: (id: number, data: Partial<BrandPayload>) =>
    apiClient.put<ApiResponse<Brand>>(`/admin/brands/${id}`, data),
  deleteBrand: (id: number) =>
    apiClient.delete<ApiResponse<null>>(`/admin/brands/${id}`),

  // Banners (homepage CMS)
  getBanners: (params?: Record<string, string | number>) =>
    apiClient.get<ApiResponse<Banner[]>>("/admin/banners", { params }),
  getBanner: (id: number) =>
    apiClient.get<ApiResponse<Banner>>(`/admin/banners/${id}`),
  createBanner: (data: BannerPayload) =>
    apiClient.post<ApiResponse<Banner>>("/admin/banners", data),
  updateBanner: (id: number, data: Partial<BannerPayload>) =>
    apiClient.put<ApiResponse<Banner>>(`/admin/banners/${id}`, data),
  deleteBanner: (id: number) =>
    apiClient.delete<ApiResponse<null>>(`/admin/banners/${id}`),

  // Orders
  getOrders: (params?: Record<string, string | number>) =>
    apiClient.get<PaginatedResponse<Order>>("/admin/orders", { params }),
  getOrder: (id: number) =>
    apiClient.get<ApiResponse<Order>>(`/admin/orders/${id}`),
  updateOrderStatus: (id: number, status: string) =>
    apiClient.put<ApiResponse<Order>>(`/admin/orders/${id}/status`, { status }),

  // Global Variant Catalog (admin-managed)
  getVariantCatalog: (params?: Record<string, string | number>) =>
    apiClient.get<ApiResponse<Variant[]>>("/admin/variants", { params }),
  createCatalogVariant: (data: CatalogVariantPayload) =>
    apiClient.post<ApiResponse<Variant>>("/admin/variants", data),
  updateCatalogVariant: (id: number, data: Partial<CatalogVariantPayload>) =>
    apiClient.put<ApiResponse<Variant>>(`/admin/variants/${id}`, data),
  deleteCatalogVariant: (id: number) =>
    apiClient.delete<ApiResponse<null>>(`/admin/variants/${id}`),

  // Product-attached Variants (pivot)
  getProductVariants: (productId: number) =>
    apiClient.get<ApiResponse<ProductVariant[]>>(
      `/admin/products/${productId}/variants`
    ),
  attachProductVariant: (productId: number, data: AttachVariantPayload) =>
    apiClient.post<ApiResponse<ProductVariant>>(
      `/admin/products/${productId}/variants`,
      data
    ),
  updateProductVariant: (
    productId: number,
    variantId: number,
    data: Partial<Omit<AttachVariantPayload, "variant_id">>
  ) =>
    apiClient.put<ApiResponse<ProductVariant>>(
      `/admin/products/${productId}/variants/${variantId}`,
      data
    ),
  detachProductVariant: (productId: number, variantId: number) =>
    apiClient.delete<ApiResponse<null>>(
      `/admin/products/${productId}/variants/${variantId}`
    ),
};

export interface CatalogVariantPayload {
  type: ProductVariantType;
  name: string;
  name_en?: string | null;
  hex_color?: string | null;
  sort_order?: number;
  is_active?: boolean;
}

export interface AttachVariantPayload {
  variant_id: number;
  sku?: string | null;
  price_adjustment?: number;
  quantity?: number;
  image?: string | null;
  is_active?: boolean;
}
