import { conekta } from './conekta';
import { mercadopago } from './mercadopago';
import type { PaymentProvider, ProviderId } from './types';

const ALL: PaymentProvider[] = [mercadopago, conekta];

/** Pasarelas con credenciales configuradas (sin ninguna, el checkout funciona en modo demo). */
export const listProviders = () => ALL.filter((p) => p.enabled());

export const getProvider = (id: string | undefined): PaymentProvider | null => {
  const enabled = listProviders();
  return enabled.find((p) => p.id === (id as ProviderId)) ?? enabled[0] ?? null;
};

export type { PaymentProvider, PaymentMethod, ProviderId } from './types';
