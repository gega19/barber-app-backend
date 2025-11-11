import { Request, Response } from 'express';
import specialtyService from '../services/specialty.service';

class SpecialtyController {
  async getSpecialties(req: Request, res: Response): Promise<void> {
    try {
      const specialties = await specialtyService.getSpecialties();
      res.status(200).json({
        success: true,
        data: specialties,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get specialties';
      res.status(500).json({ success: false, message });
    }
  }

  async getSpecialtyById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const specialty = await specialtyService.getSpecialtyById(id);
      
      if (!specialty) {
        res.status(404).json({
          success: false,
          message: 'Specialty not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: specialty,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get specialty';
      res.status(500).json({ success: false, message });
    }
  }

  async createSpecialty(req: Request, res: Response): Promise<void> {
    try {
      const { name, description } = req.body;

      if (!name || name.trim() === '') {
        res.status(400).json({
          success: false,
          message: 'El nombre de la especialidad es requerido',
        });
        return;
      }

      const specialty = await specialtyService.createSpecialty({
        name: name.trim(),
        description: description?.trim(),
      });

      res.status(201).json({
        success: true,
        data: specialty,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('Unique constraint')) {
        res.status(409).json({
          success: false,
          message: 'Ya existe una especialidad con ese nombre',
        });
        return;
      }
      const message = error instanceof Error ? error.message : 'Failed to create specialty';
      res.status(500).json({ success: false, message });
    }
  }

  async updateSpecialty(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      const specialty = await specialtyService.updateSpecialty(id, {
        name: name?.trim(),
        description: description !== undefined ? description?.trim() : undefined,
      });

      res.status(200).json({
        success: true,
        data: specialty,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('Record to update not found')) {
        res.status(404).json({
          success: false,
          message: 'Especialidad no encontrada',
        });
        return;
      }
      if (error instanceof Error && error.message.includes('Unique constraint')) {
        res.status(409).json({
          success: false,
          message: 'Ya existe una especialidad con ese nombre',
        });
        return;
      }
      const message = error instanceof Error ? error.message : 'Failed to update specialty';
      res.status(500).json({ success: false, message });
    }
  }

  async deleteSpecialty(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await specialtyService.deleteSpecialty(id);

      res.status(200).json({
        success: true,
        message: 'Especialidad eliminada exitosamente',
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
        res.status(404).json({
          success: false,
          message: 'Especialidad no encontrada',
        });
        return;
      }
      if (error instanceof Error && error.message.includes('barbero(s) la están usando')) {
        res.status(400).json({
          success: false,
          message: error.message,
        });
        return;
      }
      const message = error instanceof Error ? error.message : 'Failed to delete specialty';
      res.status(500).json({ success: false, message });
    }
  }
}

export default new SpecialtyController();
