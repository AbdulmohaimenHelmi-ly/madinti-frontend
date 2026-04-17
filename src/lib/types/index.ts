export interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  role: "customer" | "vendor" | "admin";
  is_admin: boolean;
  is_vendor: boolean;
  is_active: boolean;
  locale: string;
  created_at?: string;
}

export interface Vendor {
  id: number;
  user_id: number;
  store_name: string;
  store_name_en: string | null;
  slug: string;
  description: string | null;
  description_en: string | null;
  logo: string | null;
  banner: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  city_id: number | null;
  area_id: number | null;
  city_details?: { id: number; name: string } | null;
  area_details?: { id: number; name: string } | null;
  is_active: boolean;
  rating: number;
  total_sales: number;
  products_count?: number;
  user?: User;
  created_at?: string;
}

export type ContentType = "male" | "female" | "unisex";

export interface Category {
  id: number;
  parent_id: number | null;
  name: string;
  name_en: string | null;
  slug: string;
  description: string | null;
  image: string | null;
  is_active: boolean;
  content_type?: ContentType;
  children?: Category[];
}

export type BannerPosition =
  | "slider"
  | "left_1"
  | "left_2"
  | "left_3"
  | "right_1"
  | "right_2"
  | "right_3";

export interface Banner {
  id: number;
  position: BannerPosition;
  title: string | null;
  title_en: string | null;
  subtitle: string | null;
  subtitle_en: string | null;
  image: string;
  link: string | null;
  sort_order: number;
  is_active: boolean;
  content_type?: ContentType;
  created_at?: string;
  updated_at?: string;
}

export type ProductVariantType =
  | "color"
  | "size"
  | "material"
  | "style"
  | "other";

/**
 * Global variant catalog entry (managed by admins).
 */
export interface Variant {
  id: number;
  type: ProductVariantType;
  name: string;
  name_en: string | null;
  hex_color: string | null;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
}

/**
 * A variant attached to a product (catalog fields + per-product pivot overrides).
 */
export interface ProductVariant {
  id: number; // variant id
  type: ProductVariantType;
  name: string;
  name_en: string | null;
  hex_color: string | null;
  sort_order: number;
  sku: string | null;
  price_adjustment: number;
  quantity: number;
  image: string | null;
  is_active: boolean;
}

export interface ProductImage {
  id: number;
  product_id: number;
  image: string;
  sort_order: number;
  is_primary: boolean;
}

export interface Product {
  id: number;
  vendor_id: number;
  category_id: number;
  brand_id: number | null;
  name: string;
  name_en: string | null;
  slug: string;
  description: string;
  description_en: string | null;
  price: number;
  compare_price: number | null;
  sku: string | null;
  quantity: number;
  is_active: boolean;
  is_featured: boolean;
  rating: number;
  total_reviews: number;
  content_type?: ContentType;
  images: ProductImage[];
  variants?: ProductVariant[];
  vendor?: Vendor;
  category?: Category;
  brand?: Brand | null;
  brand_name?: string | null;
}

export interface Brand {
  id: number;
  name: string;
  name_en: string | null;
  slug: string;
  logo: string | null;
  description: string | null;
  description_en: string | null;
  sort_order: number;
  is_active: boolean;
  is_featured: boolean;
  content_type?: ContentType;
  products_count?: number;
  created_at?: string;
}

export interface CartItem {
  id: number;
  cart_id: number;
  product_id: number;
  quantity: number;
  price: number;
  product?: Product;
}

export interface Cart {
  id: number;
  user_id: number;
  items: CartItem[];
  total: number;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  vendor_id: number;
  quantity: number;
  price: number;
  total: number;
  product?: Product;
}

export interface Order {
  id: number;
  user_id: number;
  order_number: string;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";
  subtotal: number;
  shipping_cost: number;
  tax: number;
  total: number;
  shipping_address: string;
  shipping_city: string;
  shipping_phone: string;
  payment_method: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

export interface Review {
  id: number;
  user_id: number;
  product_id: number;
  rating: number;
  comment: string | null;
  created_at: string;
  user?: Pick<User, "id" | "name" | "avatar">;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone?: string;
  role?: "customer" | "vendor";
}
