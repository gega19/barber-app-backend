import { Request, Response } from 'express';
import prisma from '../config/prisma';
import barberAvailabilityService from '../services/barber-availability.service';

class BarberAvailabilityController {
  async getMyAvailability(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      // Obtener el barberId del usuario
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });

      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      const barber = await prisma.barber.findUnique({
        where: { email: user.email },
        select: { id: true },
      });

      if (!barber) {
        res.status(404).json({ success: false, message: 'Barber not found' });
        return;
      }

      const availability = await barberAvailabilityService.getAvailabilityByBarberId(barber.id);

      res.status(200).json({
        success: true,
        data: availability,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get availability';
      res.status(500).json({ success: false, message });
    }
  }

  async updateMyAvailability(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { availability } = req.body;

      if (!availability || !Array.isArray(availability)) {
        res.status(400).json({
          success: false,
          message: 'Availability array is required',
        });
        return;
      }

      // Obtener el barberId del usuario
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });

      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      const barber = await prisma.barber.findUnique({
        where: { email: user.email },
        select: { id: true },
      });

      if (!barber) {
        res.status(404).json({ success: false, message: 'Barber not found' });
        return;
      }

      const updatedAvailability = await barberAvailabilityService.updateAvailability(
        barber.id,
        availability,
      );

      res.status(200).json({
        success: true,
        data: updatedAvailability,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update availability';
      res.status(500).json({ success: false, message });
    }
  }

  async getAvailableSlots(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { date, currentTime } = req.query;

      if (!date) {
        res.status(400).json({
          success: false,
          message: 'Date query parameter is required',
        });
        return;
      }

      // Parsear la fecha correctamente (YYYY-MM-DD)
      const dateStr = date as string;
      const [year, month, day] = dateStr.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day); // month - 1 porque Date usa 0-11
      
      if (isNaN(dateObj.getTime())) {
        res.status(400).json({
          success: false,
          message: 'Invalid date format',
        });
        return;
      }

      // Parsear currentTime si se proporciona (formato: "HH:MM")
      let clientCurrentTime: string | null = null;
      if (currentTime && typeof currentTime === 'string') {
        // Validar formato HH:MM
        if (/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(currentTime)) {
          clientCurrentTime = currentTime;
        } else {
          // Si el formato es inválido, ignorarlo silenciosamente y usar hora del servidor
          console.warn(`Invalid currentTime format: ${currentTime}. Using server time instead.`);
        }
      }

      const slots = await barberAvailabilityService.getAvailableSlots(
        id, 
        dateObj,
        clientCurrentTime // Pasar la hora del cliente
      );

      res.status(200).json({
        success: true,
        data: {
          date: date,
          availableSlots: slots,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get available slots';
      res.status(500).json({ success: false, message });
    }
  }
}

export default new BarberAvailabilityController();

