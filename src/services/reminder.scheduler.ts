import cron from 'node-cron';
import prisma from '../config/prisma';
import notificationService from './notification.service';
import { getNowInAppTimezone, getAppointmentDateTime } from '../utils/timezone';

export class ReminderScheduler {
  public start() {
    // Corre cada 15 minutos
    cron.schedule('*/15 * * * *', async () => {
      console.log('[Reminder] Checking upcoming appointments...');
      await this.checkAndSendReminders();
    });
  }

  public async checkAndSendReminders() {
    try {
      // Obtenemos hora actual en la timezone de la app
      const now = getNowInAppTimezone();
      const nowMs = now.getTime();

      // Buscamos solo citas pendientes o confirmadas que puedan faltar por recordatorio
      // Solo traemos citas con userId, ya que los invitados no tienen app para push
      const appointments = await prisma.appointment.findMany({
        where: {
          status: { not: 'CANCELLED' },
          userId: { not: null },
          // Filtrar por citas que no tengan ya los recordatorios listos
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

        // Ventana de 24 horas: si faltan entre 24 y 25 horas
        if (diffHours > 24 && diffHours <= 25 && !apt.reminder24hSentAt) {
          await this.sendReminder(apt.id, apt.userId!, apt.barber.name, apt.date, apt.time, 24);
          await prisma.appointment.update({
            where: { id: apt.id },
            data: { reminder24hSentAt: new Date() }
          });
        }

        // Ventana de 1 hora: si faltan entre 1 y 1.25 horas
        if (diffHours > 1 && diffHours <= 1.25 && !apt.reminder1hSentAt) {
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
