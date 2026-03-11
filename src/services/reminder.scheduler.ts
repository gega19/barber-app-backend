import cron from 'node-cron';
import prisma from '../config/prisma';
import notificationService from './notification.service';
import { getNowInAppTimezone, getAppointmentDateTime } from '../utils/timezone';

export class ReminderScheduler {
  public start() {
    // Corre cada 5 minutos (balance ideal entre precisión y rendimiento)
    cron.schedule('*/5 * * * *', async () => {
      console.log('[Reminder] Checking upcoming appointments...');
      await this.checkAndSendReminders();
    });
  }

  public async checkAndSendReminders() {
    try {
      // Obtenemos hora actual en la timezone de la app
      const now = getNowInAppTimezone();
      const nowMs = now.getTime();
      
      // Configurar rangos de fechas (desde hoy hasta 2 días adelante) para no cargar toda la base de datos
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const twoDaysFromNow = new Date(today);
      twoDaysFromNow.setDate(today.getDate() + 2);

      // Buscamos citas pendientes usando índices de fecha para mejor rendimiento
      // Solo traemos citas de entre hoy y mañana con userId (para Push)
      const appointments = await prisma.appointment.findMany({
        where: {
          status: { not: 'CANCELLED' },
          userId: { not: null },
          // Filtrar a nivel base de datos para no afectar rendimiento con miles de citas
          date: {
            gte: today,
            lte: twoDaysFromNow
          },
          OR: [
            { reminder24hSentAt: null },
            { reminder1hSentAt: null }
          ]
        },
        include: {
          barber: { select: { id: true, name: true } }
        }
      });

      for (const apt of appointments) {
        const aptDate = getAppointmentDateTime(apt.date, apt.time);
        const diffMs = aptDate.getTime() - nowMs;
        const diffHours = diffMs / (1000 * 60 * 60);

        // Ya pasó la hora de la cita
        if (diffHours < 0) continue;

        // Ventana de 24 horas: si faltan entre 23 y 25 horas
        // Ampliamos la ventana a 23-25 para asegurar que no se salte si el cron se retrasa
        if (diffHours > 23 && diffHours <= 25 && !apt.reminder24hSentAt) {
          console.log(`[Reminder] Sending 24h reminder for ${apt.id}`);
          await this.sendReminder(apt.id, apt.userId!, apt.barber.name, apt.date, apt.time, 24);
          await prisma.appointment.update({
            where: { id: apt.id },
            data: { reminder24hSentAt: new Date() }
          });
        }

        // Ventana de 1 hora: si faltan entre 0 y 1.25 horas
        // Ampliamos la ventana para enviar justo antes
        if (diffHours > 0 && diffHours <= 1.25 && !apt.reminder1hSentAt) {
          console.log(`[Reminder] Sending 1h reminder for ${apt.id}`);
          await this.sendReminder(apt.id, apt.userId!, apt.barber.name, apt.date, apt.time, 1);
          await prisma.appointment.update({
            where: { id: apt.id },
            data: { reminder1hSentAt: new Date() }
          });
        }
      }
    } catch (error) {
      console.error('[Reminder] Error checking appointments:', error);
    }
  }

  private async sendReminder(appointmentId: string, userId: string, barberName: string, date: Date, time: string, hoursRemaining: number) {
    const timeText = hoursRemaining === 24 ? 'mañana' : 'en 1 hora';
    await notificationService.sendNotificationToUser(userId, {
      title: `Recordatorio de cita 🕒`,
      body: `Tienes una cita ${timeText} con ${barberName} a las ${time}.`,
      data: {
        type: 'appointment_reminder',
        appointmentId,
      }
    });
  }

  // Método manual para testing desde el backoffice
  public async sendTestReminder(appointmentId: string) {
    const apt = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { barber: { select: { name: true } } }
    });

    if (!apt || !apt.userId) throw new Error('Appointment not found or has no user');

    await notificationService.sendNotificationToUser(apt.userId, {
      title: `Recordatorio de cita (Prueba) 🕒`,
      body: `Esta es una prueba del recordatorio para tu cita con ${apt.barber.name} a las ${apt.time}.`,
      data: {
        type: 'appointment_reminder',
        appointmentId: apt.id,
      }
    });
  }
}

export default new ReminderScheduler();
