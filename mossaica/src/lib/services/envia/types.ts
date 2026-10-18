import type { ShippingRate } from '@/lib/types';

export type { ShippingRate };

export interface Address {
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  street: string;
  number?: string;
  district?: string;
  city: string;
  state: string; // código Envia (NL, DF, JA…) o nombre; se normaliza al enviar
  postalCode: string;
}

export interface ShipmentPackage {
  content: string;
  weight: number; // kg
  length: number; // cm
  width: number;
  height: number;
  declaredValue: number; // MXN
}

export interface QuoteInput {
  postalCode: string;
  state?: string;
  city?: string;
  weightKg: number;
  declaredValue: number;
}

export interface LabelInput {
  customer: { name: string; email?: string; phone?: string; street: string; colony?: string; city: string; state: string; postalCode: string };
  rate: { carrier: string; service: string; serviceCode?: string };
  weightKg: number;
  declaredValue: number;
  comments?: string;
}

export interface Label {
  carrier: string;
  service: string;
  trackingNumber: string;
  trackUrl: string | null;
  labelUrl: string | null; // PDF 4x6 listo para imprimir
  cost: number | null;
}

export interface TrackingEvent {
  date: string | null;
  description: string;
  location: string | null;
}

export interface Tracking {
  trackingNumber: string;
  carrier: string | null;
  status: string;
  events: TrackingEvent[];
}
