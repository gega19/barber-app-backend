/**
 * Formatea una fecha en español
 * @param date - Fecha a formatear
 * @returns Fecha formateada en español (ej: "20 de noviembre de 2024")
 */
export function formatDateInSpanish(date: Date): string {
  const months = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];

  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  return `${day} de ${month} de ${year}`;
}

/**
 * Formatea una fecha y hora en español
 * @param date - Fecha a formatear
 * @param time - Hora en formato "HH:MM"
 * @returns Fecha y hora formateada (ej: "20 de noviembre de 2024 a las 14:00")
 */
export function formatDateTimeInSpanish(date: Date, time: string): string {
  const dateStr = formatDateInSpanish(date);
  return `${dateStr} a las ${time}`;
}

