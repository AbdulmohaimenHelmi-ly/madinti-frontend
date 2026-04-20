export interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  role: "customer" | "vendor" | "admin" | "delivery";
  is_admin: boolean;
  is_vendor: boolean;
  is_delivery?: boolean;
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
  followers_count?: number;
  is_following?: boolean;
  is_blocked?: boolean;
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
 * One option group on a product (e.g. "Color", "Size").
 */
export interface ProductOptionValue {
  id: number;
  value: string;
  value_en: string | null;
  hex_color: string | null;
  position: number;
}

export interface ProductOption {
  id: number;
  name: string;
  name_ar?: string;
  name_en?: string | null;
  position: number;
  values: ProductOptionValue[];
}

/**
 * One concrete variant = a combination of option values, with its own price/stock.
 */
export interface ProductVariant {
  id: number;
  product_id: number;
  sku: string | null;
  price: number;
  compare_price: number | null;
  quantity: number;
  image: string | null;
  is_active: boolean;
  is_default: boolean;
  position: number;
  option_value_ids: number[];
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
  has_variants: boolean;
  content_type?: ContentType;
  image?: string | null;
  images: ProductImage[];
  options?: ProductOption[];
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

export interface CartItemVariantOption {
  option: string;
  option_en?: string | null;
  value: string;
  value_en?: string | null;
  hex_color?: string | null;
}

export interface CartItemVariant {
  id: number;
  sku: string | null;
  price: number;
  image: string | null;
  options: CartItemVariantOption[];
  label: string | null;
}

export interface CartItem {
  id: number;
  cart_id: number;
  product_id: number;
  product_variant_id?: number | null;
  variant?: CartItemVariant | null;
  quantity: number;
  price: number;
  subtotal?: number;
  product?: Product;
}

export interface Cart {
  id: number;
  user_id: number;
  items: CartItem[];
  total_price: number;
  items_count: number;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product_variant_id?: number | null;
  vendor_id: number;
  product_name?: string;
  variant_options?: CartItemVariantOption[] | null;
  variant_label?: string | null;
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
  shipping_address: {
    name?: string;
    phone?: string;
    address?: string;
    city?: string;
  } | string;
  shipping_city?: string;
  shipping_phone?: string;
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
