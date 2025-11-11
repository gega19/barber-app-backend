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
}

export default new SpecialtyController();
