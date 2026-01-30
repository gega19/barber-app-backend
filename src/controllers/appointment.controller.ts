import { Request, Response } from 'express';
import appointmentService from '../services/appointment.service';
import prisma from '../config/prisma';

class AppointmentController {
  async getMyAppointments(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      let appointments;
      // Check if user has a barber profile
      const barber = await prisma.barber.findUnique({
        where: { email: req.user?.email },
      });

      if (barber) {
        // User is a barber, get their appointments
        appointments = await appointmentService.getAppointmentsByBarberId(barber.id);
      } else {
        appointments = await appointmentService.getAppointmentsByUserId(userId);
      }

      res.status(200).json({
        success: true,
        data: appointments,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get appointments';
      res.status(500).json({ success: false, message });
    }
  }

  async createAppointment(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const { barberId, serviceId, date, time, paymentMethod, paymentProof, notes, currentTime, clientName, clientPhone } = req.body;

      // Validaciones
      if (!barberId || !date || !time || !paymentMethod) {
        res.status(400).json({
          success: false,
          message: 'Faltan campos requeridos: barberId, date, time, paymentMethod',
        });
        return;
      }

      // Validar formato de currentTime si se proporciona (formato: "HH:MM")
      let clientCurrentTime: string | null = null;
      if (currentTime && typeof currentTime === 'string') {
        if (/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(currentTime)) {
          clientCurrentTime = currentTime;
        } else {
          console.warn(`Invalid currentTime format: ${currentTime}. Using server time instead.`);
        }
      }

      // Parsear la fecha
      const dateStr = date as string;
      const [year, month, day] = dateStr.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day);

      if (isNaN(dateObj.getTime())) {
        res.status(400).json({
          success: false,
          message: 'Formato de fecha inválido. Use YYYY-MM-DD',
        });
        return;
      }

      // Validar que la fecha no sea en el pasado
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (dateObj < today) {
        res.status(400).json({
          success: false,
          message: 'No se pueden crear citas en fechas pasadas',
        });
        return;
      }

      // Determinar si es una cita de invitado (manual) o de usuario registrado
      // Si se proporciona clientName, asumimos que es una cita manual (guest)
      const appointmentUserId = clientName ? null : userId;

      // Crear la cita
      const appointment = await appointmentService.createAppointment({
        userId: appointmentUserId,
        barberId,
        serviceId: serviceId || undefined,
        date: dateObj,
        time: time as string,
        paymentMethod: paymentMethod as string,
        paymentProof: paymentProof as string | undefined,
        notes: notes as string | undefined,
        clientCurrentTime: clientCurrentTime, // Pasar la hora del cliente
        clientName: clientName as string | undefined,
        clientPhone: clientPhone as string | undefined,
      });

      res.status(201).json({
        success: true,
        data: appointment,
        message: 'Cita creada exitosamente',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create appointment';

      // Manejar errores específicos
      if (message.includes('no está disponible') || message.includes('ya está reservado')) {
        res.status(409).json({ success: false, message });
      } else {
        res.status(500).json({ success: false, message });
      }
    }
  }

  async getAllAppointments(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string | undefined;
      const status = req.query.status as string | undefined;
      const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined;
      const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : undefined;

      const result = await appointmentService.getAllAppointments(page, limit, search, status, dateFrom, dateTo);

      res.status(200).json({
        success: true,
        data: result.appointments,
        pagination: result.pagination,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get appointments';
      res.status(500).json({ success: false, message });
    }
  }

  async getAppointmentById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const appointment = await appointmentService.getAppointmentById(id);

      res.status(200).json({
        success: true,
        data: appointment,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get appointment';
      if (message.includes('not found')) {
        res.status(404).json({ success: false, message });
      } else {
        res.status(500).json({ success: false, message });
      }
    }
  }

  async updateAppointment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status, date, time, paymentMethod, notes } = req.body;

      const appointment = await appointmentService.updateAppointment(id, {
        status,
        date: date ? new Date(date) : undefined,
        time,
        paymentMethod,
        notes,
      });

      res.status(200).json({
        success: true,
        data: appointment,
        message: 'Cita actualizada exitosamente',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update appointment';
      res.status(500).json({ success: false, message });
    }
  }

  async deleteAppointment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await appointmentService.deleteAppointment(id);

      res.status(200).json({
        success: true,
        message: 'Cita eliminada exitosamente',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete appointment';
      res.status(500).json({ success: false, message });
    }
  }

  async cancelAppointment(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      // Obtener la cita para verificar permisos
      const appointment = await prisma.appointment.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
          barber: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (!appointment) {
        res.status(404).json({
          success: false,
          message: 'Cita no encontrada',
        });
        return;
      }

      // Verificar si el usuario es el cliente o el barbero
      const barber = await prisma.barber.findUnique({
        where: { email: req.user?.email },
        select: { id: true },
      });

      const isClient = appointment.userId === userId;
      const isBarber = barber && appointment.barberId === barber.id;

      if (!isClient && !isBarber) {
        res.status(403).json({
          success: false,
          message: 'No tienes permiso para cancelar esta cita',
        });
        return;
      }

      // Cancelar la cita (marcar como CANCELLED en lugar de eliminarla)
      await appointmentService.updateAppointment(id, {
        status: 'CANCELLED',
      });

      // Enviar notificación al otro usuario (cliente o barbero)
      setImmediate(async () => {
        try {
          const notificationService = (await import('../services/notification.service')).default;
          const { formatDateTimeInSpanish } = await import('../utils/date-formatter');

          const dateTimeStr = formatDateTimeInSpanish(appointment.date, appointment.time);

          if (isClient) {
            // Cliente canceló - notificar al barbero
            const barberUser = await prisma.user.findUnique({
              where: { email: appointment.barber.email },
              select: { id: true },
            });

            if (barberUser) {
              const clientName = appointment.user?.name || appointment.clientName || 'El cliente';
              await notificationService.sendNotificationToUser(barberUser.id, {
                title: 'Cita Cancelada',
                body: `${clientName} ha cancelado la cita para el ${dateTimeStr}`,
                data: {
                  type: 'appointment_cancelled',
                  appointmentId: appointment.id,
                  barberId: appointment.barberId,
                },
              });
            }
          } else if (isBarber) {
            // Barbero canceló - notificar al cliente (solo si tiene usuario registrado)
            if (appointment.userId) {
              await notificationService.sendNotificationToUser(appointment.userId, {
                title: 'Cita Cancelada',
                body: `${appointment.barber.name} ha cancelado tu cita para el ${dateTimeStr}`,
                data: {
                  type: 'appointment_cancelled',
                  appointmentId: appointment.id,
                  userId: appointment.userId,
                },
              });
            }
          }
        } catch (error) {
          console.error('Error sending cancellation notification:', error);
          // No fallar la operación si la notificación falla
        }
      });

      res.status(200).json({
        success: true,
        message: 'Cita cancelada exitosamente',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to cancel appointment';
      res.status(500).json({ success: false, message });
    }
  }

  async markAsAttended(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      // Verificar que el usuario es barbero y que la cita le pertenece
      const barber = await prisma.barber.findUnique({
        where: { email: req.user?.email },
        select: { id: true },
      });

      if (!barber) {
        res.status(403).json({
          success: false,
          message: 'Solo los barberos pueden marcar citas como atendidas',
        });
        return;
      }

      // Verificar que la cita pertenece a este barbero
      const appointment = await prisma.appointment.findUnique({
        where: { id },
        select: { barberId: true, status: true },
      });

      if (!appointment) {
        res.status(404).json({
          success: false,
          message: 'Cita no encontrada',
        });
        return;
      }

      if (appointment.barberId !== barber.id) {
        res.status(403).json({
          success: false,
          message: 'No tienes permiso para marcar esta cita como atendida',
        });
        return;
      }

      // Marcar la cita como COMPLETED (atendida)
      await appointmentService.updateAppointment(id, {
        status: 'COMPLETED',
      });

      res.status(200).json({
        success: true,
        message: 'Cita marcada como atendida exitosamente',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to mark appointment as attended';
      res.status(500).json({ success: false, message });
    }
  }

  async getPendingPaymentAppointments(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const paymentStatus = req.query.paymentStatus as string | undefined;

      const result = await appointmentService.getPendingPaymentAppointments(page, limit, paymentStatus);

      res.status(200).json({
        success: true,
        data: result.appointments,
        pagination: result.pagination,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get pending payment appointments';
      res.status(500).json({ success: false, message });
    }
  }

  async verifyPayment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { verified } = req.body;

      if (typeof verified !== 'boolean') {
        res.status(400).json({
          success: false,
          message: 'El campo verified debe ser un booleano',
        });
        return;
      }

      const appointment = await appointmentService.verifyPayment(id, verified);

      res.status(200).json({
        success: true,
        data: appointment,
        message: verified ? 'Pago verificado exitosamente' : 'Pago rechazado',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to verify payment';
      res.status(500).json({ success: false, message });
    }
  }

  async getBarberQueue(req: Request, res: Response): Promise<void> {
    try {
      const { barberId } = req.params;
      const dateParam = req.query.date as string | undefined;

      if (!barberId) {
        res.status(400).json({
          success: false,
          message: 'barberId is required',
        });
        return;
      }

      // Parsear fecha o usar hoy por defecto
      let targetDate: Date;
      if (dateParam) {
        const [year, month, day] = dateParam.split('-').map(Number);
        targetDate = new Date(year, month - 1, day);

        if (isNaN(targetDate.getTime())) {
          res.status(400).json({
            success: false,
            message: 'Invalid date format. Use YYYY-MM-DD',
          });
          return;
        }
      } else {
        // Usar hoy por defecto
        targetDate = new Date();
        targetDate.setHours(0, 0, 0, 0);
      }

      // Obtener citas del barbero para la fecha especificada
      const appointments = await appointmentService.getAppointmentsByBarberId(barberId);

      // Filtrar por fecha y ordenar por hora
      const dayStart = new Date(targetDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(targetDate);
      dayEnd.setHours(23, 59, 59, 999);

      const dayAppointments = appointments
        .filter((apt: any) => {
          const aptDate = new Date(apt.date);
          return aptDate >= dayStart && aptDate <= dayEnd;
        })
        .sort((a: any, b: any) => {
          // Ordenar por hora (formato HH:MM)
          return a.time.localeCompare(b.time);
        });

      res.status(200).json({
        success: true,
        data: {
          barberId,
          date: dateParam || targetDate.toISOString().split('T')[0],
          appointments: dayAppointments,
          count: dayAppointments.length,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get barber queue';
      res.status(500).json({ success: false, message });
    }
  }
}

export default new AppointmentController();
