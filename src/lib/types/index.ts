export interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  role: "customer" | "vendor" | "admin";
  locale: string;
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
  is_active: boolean;
  rating: number;
  total_sales: number;
  user?: User;
}

export interface Category {
  id: number;
  parent_id: number | null;
  name: string;
  name_en: string | null;
  slug: string;
  description: string | null;
  image: string | null;
  is_active: boolean;
  children?: Category[];
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
  images: ProductImage[];
  vendor?: Vendor;
  category?: Category;
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
