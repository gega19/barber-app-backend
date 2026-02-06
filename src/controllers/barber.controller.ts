import { Request, Response } from 'express';
import barberService from '../services/barber.service';
import prisma from '../config/prisma';

class BarberController {
  async getBarbers(req: Request, res: Response): Promise<void> {
    try {
      const result = await barberService.getBarbers();

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get barbers';
      res.status(500).json({ success: false, message });
    }
  }

  async getMe(req: Request, res: Response): Promise<void> {
    try {
      const email = req.user?.email;
      if (!email) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      // Buscar el barbero por email (asumiendo que el email del usuario es el mismo que el del barbero)
      // Usamos prisma directamente o hacemos un search?
      // Mejor usamos prisma aquí para ser directos o añadimos método a servicio.
      // Ya tenemos lógica parecida en AppointmentController.

      // Importamos prisma si no está importado o usamos servicio si existe findByEmail
      // barberService no tiene findByEmail expuesto públicamente, pero getBarbers filtra? No.
      // Vamos a usar prisma directamente aquí por simplicidad y ya que el controlador suele tener acceso a modelo

      // Necesito importar prisma arriba si no está.
      // Veo que appointment.controller.ts importa prisma. BarberController no lo sé. 
      // Si no, añado un método a BarberService.

      // Mejor práctica: añadir a BarberService.
      const barber = await prisma.barber.findUnique({
        where: { email },
        include: { services: true, specialtyRef: true }
      });

      if (!barber) {
        res.status(404).json({ success: false, message: 'Barber profile not found' });
        return;
      }

      res.status(200).json({
        success: true,
        data: barber,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get barber profile';
      res.status(500).json({ success: false, message });
    }
  }

  async getBestBarbers(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
      const result = await barberService.getBestBarbers(limit, offset);
      res.status(200).json({
        success: true,
        data: result.barbers,
        lastWinnerBarberId: result.lastWinnerBarberId ?? null,
        pagination: {
          limit,
          offset,
          count: result.barbers.length,
          total: result.total,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get best barbers';
      res.status(500).json({ success: false, message });
    }
  }

  /**
   * POST /api/barbers/admin/recompute-wall-scores
   * Recomputes wallScore for all barbers. Admin only. Use in prod after deploy or on demand.
   */
  async recomputeWallScores(req: Request, res: Response): Promise<void> {
    try {
      await barberService.recomputeAllWallScores();
      res.status(200).json({
        success: true,
        message: 'Wall scores recomputed for all barbers',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to recompute wall scores';
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

      const {
        specialty,
        specialtyId,
        experienceYears,
        location,
        latitude,
        longitude,
        instagramUrl,
        tiktokUrl
      } = req.body;

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
        instagramUrl: instagramUrl !== undefined ? instagramUrl : undefined,
        tiktokUrl: tiktokUrl !== undefined ? tiktokUrl : undefined,
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

  async getFavorites(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const favorites = await barberService.getFavorites(userId);
      res.status(200).json({
        success: true,
        data: favorites,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get favorites';
      res.status(500).json({ success: false, message });
    }
  }

  async toggleFavorite(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const { id } = req.params; // Barber ID
      const result = await barberService.toggleFavorite(userId, id);

      res.status(200).json({
        success: true,
        data: result,
        message: result.isFavorite ? 'Barber added to favorites' : 'Barber removed from favorites',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to toggle favorite';
      res.status(500).json({ success: false, message });
    }
  }

  async getBarberBySlug(req: Request, res: Response): Promise<void> {
    try {
      const { slug } = req.params;
      const barber = await barberService.getBarberBySlug(slug);

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
      const message = error instanceof Error ? error.message : 'Failed to get barber profile';
      res.status(500).json({ success: false, message });
    }
  }
}

export default new BarberController();
