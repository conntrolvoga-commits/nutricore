export type Rango = 'A' | 'B' | 'C';

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number; // MXN
  rango: Rango;
  category: string; // tipo de figura
  stock: number;
  emoji: string; // arte de respaldo cuando no hay imágenes
  color: string; // color de fondo del arte de respaldo
  images: string[];
  weightKg: number;
  featured: boolean;
  isNew: boolean;
  bestSeller: boolean;
}

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  price: number;
  quantity: number;
  emoji: string;
  color: string;
  image?: string;
  stock: number;
  weightKg: number;
}

export interface ShippingAddress {
  name: string;
  email: string;
  phone: string;
  street: string;
  colony: string;
  city: string;
  state: string;
  postalCode: string;
}

export interface ShippingRate {
  carrier: string;
  service: string; // nombre para mostrar
  serviceCode?: string; // código de Envia, necesario para generar la guía
  price: number;
  days: number | null;
}
