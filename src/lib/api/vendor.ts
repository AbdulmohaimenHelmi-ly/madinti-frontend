import apiClient from "./client";
import type {
  ApiResponse,
  Brand,
  Category,
  Order,
  PaginatedResponse,
  Product,
  ProductOption,
  ProductVariant,
  Vendor,
} from "../types";
import type { ProductPayload, SaveVariantPayload } from "./admin";

export interface VendorDashboardPayload {
  vendor: Vendor;
  total_products: number;
  total_orders: number;
  total_sales: number;
  rating: number;
  charts?: {
    orders_daily: Array<{ date: string; orders: number; revenue: number }>;
    status_breakdown: Array<{ status: string; count: number }>;
    top_products: Array<{ product_id: number; name: string; quantity: number; revenue: number }>;
    orders_by_weekday: Array<{ dow: number; count: number }>;
    revenue_by_status: Array<{ status: string; revenue: number }>;
  };
}

// `vendor_id` is inferred from the authenticated vendor on the backend; the
// vendor-scoped create/update endpoints don't accept it from the client.
export type VendorProductPayload = ProductPayload;

export const vendorApi = {
  getDashboard: () =>
    apiClient.get<ApiResponse<VendorDashboardPayload>>("/vendor/dashboard"),

  getProducts: (params?: Record<string, string | number>) =>
    apiClient.get<PaginatedResponse<Product>>("/vendor/products", { params }),

  // Per-product CRUD for the signed-in vendor's own catalog.
  createProduct: (data: VendorProductPayload) =>
    apiClient.post<ApiResponse<Product>>("/vendor/products", data),
  updateProduct: (id: number, data: VendorProductPayload) =>
    apiClient.put<ApiResponse<Product>>(`/vendor/products/${id}`, data),
  deleteProduct: (id: number) =>
    apiClient.delete<ApiResponse<null>>(`/vendor/products/${id}`),

  // Variants (mirrors the admin endpoints under /vendor/products/{p}/variants).
  listVariants: (productId: number) =>
    apiClient.get<ApiResponse<ProductVariant[]>>(
      `/vendor/products/${productId}/variants`
    ),
  createVariant: (productId: number, data: SaveVariantPayload) =>
    apiClient.post<ApiResponse<ProductVariant>>(
      `/vendor/products/${productId}/variants`,
      data
    ),
  updateVariant: (
    productId: number,
    variantId: number,
    data: SaveVariantPayload
  ) =>
    apiClient.put<ApiResponse<ProductVariant>>(
      `/vendor/products/${productId}/variants/${variantId}`,
      data
    ),
  deleteVariant: (productId: number, variantId: number) =>
    apiClient.delete<ApiResponse<null>>(
      `/vendor/products/${productId}/variants/${variantId}`
    ),

  // Read-only catalogs the vendor needs in its forms.
  listOptions: () =>
    apiClient.get<ApiResponse<ProductOption[]>>("/vendor/options"),
  listCategories: () =>
    apiClient.get<ApiResponse<Category[]>>("/categories"),
  listBrands: () =>
    apiClient.get<ApiResponse<Brand[]>>("/brands"),

  getOrders: (params?: Record<string, string | number>) =>
    apiClient.get<PaginatedResponse<Order>>("/vendor/orders", { params }),

  updateOrderStatus: (orderId: number | string, status: string) =>
    apiClient.put<ApiResponse<Order>>(`/vendor/orders/${orderId}/status`, {
      status,
    }),
};
