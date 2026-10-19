export type PaymentMethod = 'card' | 'oxxo' | 'spei';
export type ProviderId = 'mercadopago' | 'conekta';

export interface CheckoutItem {
  title: string;
  quantity: number;
  unitPrice: number; // MXN, con decimales
}

export interface CheckoutInput {
  orderId: string;
  items: CheckoutItem[];
  shippingCost: number;
  customer: { name: string; email: string; phone?: string };
  address?: { street: string; colony?: string; city: string; state: string; postalCode: string };
  siteUrl: string;
}

export interface CheckoutResult {
  url: string;
  demo?: boolean;
}

/** Contrato que cumple cada pasarela: agregar otra (Stripe, PayPal…) es crear un archivo y registrarlo. */
export interface PaymentProvider {
  id: ProviderId;
  label: string;
  methods: PaymentMethod[];
  enabled(): boolean;
  createCheckout(input: CheckoutInput): Promise<CheckoutResult>;
}

export type PaymentOutcome = 'paid' | 'pending' | 'failed';
