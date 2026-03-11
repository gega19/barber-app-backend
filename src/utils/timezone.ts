const APP_TZ = process.env.APP_TIMEZONE || 'America/Caracas';

export function getNowInAppTimezone(): Date {
  const now = new Date();
  const localStr = now.toLocaleString('en-US', { timeZone: APP_TZ });
  return new Date(localStr);
}

export function getAppointmentDateTime(date: Date, time: string): Date {
  // Combine date (without time) + time string (e.g. "10:00") in the app's TZ
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const localStr = `${dateStr}T${time}:00`;
  // Interpret as local time in app TZ, then convert to UTC for comparison
  return new Date(new Date(localStr).toLocaleString('en-US', { timeZone: 'UTC' }));
}
