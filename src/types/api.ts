// src/types/api.ts - Tipos para las respuestas de las APIs de Xano

export interface User {
  id: number;
  name: string;
  email: string;
  created_at: number;
}

export interface AuthLoginResponse {
  authToken: string;
}

export interface Product {
  id: number;
  created_at: number;
  name: string;
  description: string;
  type: string;
  series: string;
  brand: string;
  price: number;
  stock_quantity: number;
  weight: number;
  release_year: number;
  is_active: boolean;
  image_url?: ImageResource;
  images?: ImageResource[];
}

export interface ImageResource {
  access: 'public' | 'private';
  path: string;
  name: string;
  type: string;
  size: number;
  mime: string;
  meta: Record<string, any>;
  url?: string;
}

export interface Category {
  id: number;
  created_at: number;
  name: string;
  description: string;
  category_type: string;
}

export interface Order {
  id: number;
  created_at: number;
  order_number: string;
  total_amount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  payment_method: string;
  payment_status: 'pending' | 'paid' | 'failed';
  user_id: number;
  shipping_address_id: number;
}

export interface OrderItem {
  id: number;
  created_at: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
  order_id: number;
  product_id: number;
}

export interface Address {
  id: number;
  created_at: number;
  street: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  is_default: boolean;
  user_id: number;
}

export interface Inventory {
  id: number;
  created_at: number;
  stock_change: number;
  change_type: string;
  notes: string;
  product_id: number;
}

export interface Review {
  id: number;
  created_at: number;
  rating?: number;
  comment?: string;
  user_id?: number;
  product_id?: number;
}

export interface ProductCategoryRelation {
  id: number;
  created_at: number;
  product_id: number;
  product_category_id: number;
}

// Tipos auxiliares para peticiones
export interface ListProductsParams {
  token?: string;
  limit?: number;
  offset?: number;
  q?: string;
}

export interface CreateProductPayload {
  name: string;
  description?: string;
  type?: string;
  series?: string;
  brand?: string;
  price: number;
  stock_quantity?: number;
  weight?: number;
  release_year?: number;
  is_active?: boolean;
  image_url?: ImageResource;
}

export interface CreateOrderPayload {
  order_number?: string;
  total_amount: number;
  status?: Order['status'];
  payment_method: string;
  payment_status?: Order['payment_status'];
  user_id: number;
  shipping_address_id?: number;
}

export interface CreateCategoryPayload {
  name: string;
  description?: string;
  category_type?: string;
}
