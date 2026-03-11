import { getNowInAppTimezone, getAppointmentDateTime } from './src/utils/timezone';

console.log("APP_TZ:", process.env.APP_TIMEZONE || 'America/Caracas');
const now = getNowInAppTimezone();
console.log("getNowInAppTimezone():", now.toISOString(), now.toString());

// Un date típico de Prisma (viene en UTC)
const prismaDate = new Date('2026-03-11T12:00:00.000Z');
const time = '16:00';
const aptDate = getAppointmentDateTime(prismaDate, time);

console.log("getAppointmentDateTime:", aptDate.toISOString(), aptDate.toString());

const diffMs = aptDate.getTime() - now.getTime();
console.log("diffHours:", diffMs / (1000 * 60 * 60));

