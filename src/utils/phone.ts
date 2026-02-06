/**
 * Normaliza un número de teléfono a formato E.164 para comparación y almacenamiento.
 * Así 04241821619 y +58 424 182 1619 se tratan como el mismo número (+584241821619).
 */
export function normalizePhoneToE164(phone: string): string {
  const cleaned = phone.trim().replace(/[\s\-\(\)]/g, '');
  const digits = cleaned.startsWith('+')
    ? cleaned.slice(1).replace(/\D/g, '')
    : cleaned.replace(/\D/g, '');
  if (digits.length === 0) return '';
  // Venezuela: 0 + 10 dígitos (ej. 04241821619) -> +58 424 182 1619
  if (digits.startsWith('0')) {
    return '+' + '58' + digits.slice(1);
  }
  return '+' + digits;
}
