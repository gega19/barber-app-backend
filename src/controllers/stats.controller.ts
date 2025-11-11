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
}

export default new StatsController();

