export class EnviaError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export const enviaConfigured = () => Boolean(process.env.ENVIA_API_TOKEN);

const baseUrl = () => process.env.ENVIA_API_URL ?? (process.env.ENVIA_ENV === 'sandbox' ? 'https://api-test.envia.com' : 'https://api.envia.com');

/** POST autenticado a Envia.com. Falla con un EnviaError legible (el cuerpo de error de Envia trae el motivo). */
export async function enviaPost(path: string, body: unknown, timeoutMs = 10_000): Promise<unknown> {
  const res = await fetch(`${baseUrl()}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.ENVIA_API_TOKEN}` },
    body: JSON.stringify(body),
    cache: 'no-store',
    signal: AbortSignal.timeout(timeoutMs),
  });
  const json = await res.json().catch(() => null);
  const apiError = (json as { error?: { message?: string }; message?: string } | null)?.error?.message ?? (json as { message?: string } | null)?.message;
  if (!res.ok || (json as { meta?: string } | null)?.meta === 'error') throw new EnviaError(apiError ?? `Envia respondió ${res.status}`, res.status);
  return json;
}
