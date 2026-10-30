export const mxn = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://mosaicca.mx';
