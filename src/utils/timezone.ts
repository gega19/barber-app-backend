const APP_TZ = process.env.APP_TIMEZONE || 'America/Caracas';

export function getNowInAppTimezone(): Date {
  // The server runs in timezone offset, so new Date() gives the absolute actual moment
  return new Date();
}

export function getAppointmentDateTime(date: Date, time: string): Date {
  const [hours, minutes] = time.split(':').map(Number);
  // date in DB is UTC midnight (or noon). We extract the exact year, month, day it intends.
  // We then use the native Date constructor, which uses the server's local timezone (America/Caracas).
  return new Date(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    hours,
    minutes,
    0,
    0
  );
}
