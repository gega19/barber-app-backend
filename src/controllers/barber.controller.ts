import { Request, Response } from 'express';
import barberService from '../services/barber.service';
import prisma from '../config/prisma';

class BarberController {
  async getBarbers(req: Request, res: Response): Promise<void> {
    try {
      const barbers = await barberService.getBarbers();
      res.status(200).json({
        success: true,
        data: barbers,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get barbers';
      res.status(500).json({ success: false, message });
    }
  }

  async getBestBarbers(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const barbers = await barberService.getBestBarbers(limit);
      res.status(200).json({
        success: true,
        data: barbers,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get best barbers';
      res.status(500).json({ success: false, message });
    }
  }

  async getBarberById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const barber = await barberService.getBarberById(id);
      
      if (!barber) {
        res.status(404).json({
          success: false,
          message: 'Barber not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: barber,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get barber';
      res.status(500).json({ success: false, message });
    }
  }

  async updateBarberInfo(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const { specialty, specialtyId, experienceYears, location, latitude, longitude } = req.body;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, role: true },
      });

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      // Check if user has a barber profile
      const barberProfile = await prisma.barber.findUnique({
        where: { email: user.email },
      });

      if (!barberProfile) {
        res.status(403).json({
          success: false,
          message: 'User is not a barber',
        });
        return;
      }

      const barber = await barberService.updateBarberInfo(user.email, {
        specialty,
        specialtyId,
        experienceYears: experienceYears ? parseInt(experienceYears, 10) : undefined,
        location,
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined,
      });

      res.status(200).json({
        success: true,
        data: barber,
        message: 'Barber info updated successfully',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update barber info';
      res.status(500).json({ success: false, message });
    }
  }

  async searchBarbers(req: Request, res: Response): Promise<void> {
    try {
      const { q } = req.query;
      
      if (!q || typeof q !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Search query is required',
        });
        return;
      }

      const barbers = await barberService.searchBarbers(q);
      res.status(200).json({
        success: true,
        data: barbers,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to search barbers';
      res.status(500).json({ success: false, message });
    }
  }

  async getBarbersByWorkplace(req: Request, res: Response): Promise<void> {
    try {
      const { workplaceId } = req.params;
      const barbers = await barberService.getBarbersByWorkplaceId(workplaceId);
      res.status(200).json({
        success: true,
        data: barbers,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get barbers';
      res.status(500).json({ success: false, message });
    }
  }
}

export default new BarberController();
