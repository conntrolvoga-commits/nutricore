// Constructores y lectores puros de la API de Envia.com (sin red ni variables de entorno).
import type { Address, Label, ShipmentPackage, ShippingRate, Tracking } from './types';

/** Códigos de estado que usa Envia para México. */
const STATES: Record<string, string> = {
  aguascalientes: 'AG', 'baja california': 'BC', 'baja california sur': 'BS', campeche: 'CM', chiapas: 'CS', chihuahua: 'CH',
  coahuila: 'CO', colima: 'CL', 'ciudad de mexico': 'DF', cdmx: 'DF', 'distrito federal': 'DF', df: 'DF', durango: 'DG',
  guanajuato: 'GT', guerrero: 'GR', hidalgo: 'HG', jalisco: 'JA', 'estado de mexico': 'EM', edomex: 'EM', mexico: 'EM',
  michoacan: 'MI', morelos: 'MO', nayarit: 'NA', 'nuevo leon': 'NL', oaxaca: 'OA', puebla: 'PU', queretaro: 'QT',
  'quintana roo': 'QR', 'san luis potosi': 'SL', sinaloa: 'SI', sonora: 'SO', tabasco: 'TB', tamaulipas: 'TM',
  tlaxcala: 'TL', veracruz: 'VE', yucatan: 'YU', zacatecas: 'ZA',
};
const CODES = new Set(Object.values(STATES));

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim();

/** "Nuevo León" → "NL". Si ya es un código válido lo respeta; si no lo reconoce, lo devuelve en mayúsculas. */
export function normalizeState(input: string | undefined): string {
  const raw = (input ?? '').trim();
  if (CODES.has(raw.toUpperCase())) return raw.toUpperCase();
  return STATES[fold(raw)] ?? raw.toUpperCase();
}

/** "Av. Juárez 123 B" → { street: "Av. Juárez", number: "123 B" }. Sin número → "S/N". */
export function splitStreet(full: string): { street: string; number: string } {
  const m = full.trim().match(/^(.*?)[\s,#]+(?:no\.?\s*)?(\d+[\w-]*(?:\s+[A-Za-z]\b)?)$/i);
  return m && m[1] ? { street: m[1].trim(), number: m[2].trim() } : { street: full.trim(), number: 'S/N' };
}

/** Caja según el peso: las paqueterías cobran por peso facturable (mínimo 1 kg). */
export function packageFor(weightKg: number, declaredValue: number, content = 'Productos personalizados'): ShipmentPackage {
  const weight = Math.max(1, Math.ceil(weightKg));
  const [length, width, height] = weight <= 1 ? [20, 15, 10] : weight <= 3 ? [30, 20, 15] : weight <= 6 ? [40, 30, 20] : [50, 40, 30];
  return { content, weight, length, width, height, declaredValue: Math.max(0, Math.round(declaredValue)) };
}

const digits10 = (p?: string) => (p ?? '').replace(/\D/g, '').slice(-10);

export function toEnviaAddress(a: Address) {
  const split = a.number ? { street: a.street, number: a.number } : splitStreet(a.street);
  return {
    name: a.name,
    company: a.company ?? '',
    email: a.email ?? '',
    phone: digits10(a.phone),
    street: split.street,
    number: split.number,
    district: a.district ?? '',
    city: a.city,
    state: normalizeState(a.state),
    country: 'MX',
    postalCode: a.postalCode,
  };
}

const pkgBody = (p: ShipmentPackage) => [{
  content: p.content, amount: 1, type: 'box',
  dimensions: { length: p.length, width: p.width, height: p.height },
  weight: p.weight, insurance: 0, declaredValue: p.declaredValue, weightUnit: 'KG', lengthUnit: 'CM',
}];

export function buildRateBody(origin: Address, destination: Address, pkg: ShipmentPackage, carrier: string) {
  return { origin: toEnviaAddress(origin), destination: toEnviaAddress(destination), packages: pkgBody(pkg), shipment: { carrier, type: 1 }, settings: { currency: 'MXN' } };
}

export function buildLabelBody(origin: Address, destination: Address, pkg: ShipmentPackage, rate: { carrier: string; service: string; serviceCode?: string }, comments?: string) {
  return {
    origin: toEnviaAddress(origin), destination: toEnviaAddress(destination), packages: pkgBody(pkg),
    shipment: { carrier: rate.carrier, service: rate.serviceCode ?? rate.service, type: 1 },
    settings: { printFormat: 'PDF', printSize: 'STOCK_4X6', currency: 'MXN', ...(comments ? { comments } : {}) },
  };
}

type Json = Record<string, unknown>;
const list = (json: unknown): Json[] => (Array.isArray((json as Json)?.data) ? ((json as Json).data as Json[]) : []);

/** "2-3 days" → 3 (el máximo del rango). */
const daysOf = (s: unknown): number | null => {
  const nums = String(s ?? '').match(/\d+/g);
  return nums ? Math.max(...nums.map(Number)) : null;
};

export function parseRates(json: unknown): ShippingRate[] {
  return list(json)
    .filter((r) => Number(r.totalPrice) > 0 && r.carrier && r.service)
    .map((r) => ({
      carrier: String(r.carrier),
      service: String(r.serviceDescription ?? r.service),
      serviceCode: String(r.service),
      price: Math.ceil(Number(r.totalPrice)),
      days: daysOf(r.deliveryEstimate),
    }));
}

export function parseLabel(json: unknown): Label | null {
  const r = list(json)[0];
  if (!r?.trackingNumber) return null;
  return {
    carrier: String(r.carrier ?? ''), service: String(r.service ?? ''), trackingNumber: String(r.trackingNumber),
    trackUrl: (r.trackUrl as string) ?? null, labelUrl: (r.label as string) ?? null,
    cost: r.totalPrice != null ? Number(r.totalPrice) : null,
  };
}

export function parseTracking(json: unknown, trackingNumber: string): Tracking {
  const r = list(json)[0] ?? {};
  const raw = (r.eventHistory ?? r.events ?? []) as Json[];
  return {
    trackingNumber, carrier: (r.carrier as string) ?? null, status: String(r.status ?? 'Sin información'),
    events: raw.map((e) => ({
      date: (e.timestamp ?? e.date ?? e.eventDate ?? null) as string | null,
      description: String(e.description ?? e.status ?? e.event ?? ''),
      location: (e.location as string) ?? null,
    })),
  };
}
