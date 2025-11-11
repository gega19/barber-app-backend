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

      const { barberId, serviceId, date, time, paymentMethod, paymentProof, notes } = req.body;

      // Validaciones
      if (!barberId || !date || !time || !paymentMethod) {
        res.status(400).json({
          success: false,
          message: 'Faltan campos requeridos: barberId, date, time, paymentMethod',
        });
        return;
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

      // Crear la cita
      const appointment = await appointmentService.createAppointment({
        userId,
        barberId,
        serviceId: serviceId || undefined,
        date: dateObj,
        time: time as string,
        paymentMethod: paymentMethod as string,
        paymentProof: paymentProof as string | undefined,
        notes: notes as string | undefined,
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
}

export default new AppointmentController();
