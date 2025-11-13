import { Request, Response } from 'express';
import statsService from '../services/stats.service';

class StatsController {
  async getDashboardStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await statsService.getDashboardStats();
      
      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get dashboard stats';
      res.status(500).json({
        success: false,
        message,
      });
    }
  }

  async getAppointmentsByMonth(req: Request, res: Response): Promise<void> {
    try {
      const data = await statsService.getAppointmentsByMonth();
      
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get appointments by month';
      res.status(500).json({
        success: false,
        message,
      });
    }
  }

  async getRevenueByMonth(req: Request, res: Response): Promise<void> {
    try {
      const data = await statsService.getRevenueByMonth();
      
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get revenue by month';
      res.status(500).json({
        success: false,
        message,
      });
    }
  }

  async getAppointmentsByStatus(req: Request, res: Response): Promise<void> {
    try {
      const data = await statsService.getAppointmentsByStatus();
      
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get appointments by status';
      res.status(500).json({
        success: false,
        message,
      });
    }
  }
}

export default new StatsController();

