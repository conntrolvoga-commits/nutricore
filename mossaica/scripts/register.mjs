// Permite importar módulos TypeScript sin extensión en las pruebas de Node (como lo hace Next al compilar).
import { register } from 'node:module';
register('data:text/javascript,' + encodeURIComponent(`
export async function resolve(specifier, context, next) {
  if (specifier.startsWith('.') && !/\\.[cm]?[jt]s$/.test(specifier)) {
    try { return await next(specifier + '.ts', context); } catch {}
  }
  return next(specifier, context);
}`));
