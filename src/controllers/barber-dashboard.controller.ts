import { Request, Response } from 'express';
import barberDashboardService from '../services/barber-dashboard.service';

class BarberDashboardController {

  /**
   * GET /api/barber-dashboard/:barberId/daily?date=YYYY-MM-DD
   * Resumen del día: citas, ganancias, estado
   */
  async getDailySummary(req: Request, res: Response): Promise<void> {
    try {
      const { barberId } = req.params;
      // Keep as raw string — the service builds the UTC range directly from YYYY-MM-DD
      const dateParam = (req.query.date as string | undefined) ?? null;

      // Validate format if provided
      if (dateParam && !/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
        res.status(400).json({ success: false, message: 'Invalid date format. Use YYYY-MM-DD' });
        return;
      }

      const data = await barberDashboardService.getDailySummary(barberId, dateParam);
      res.status(200).json({ success: true, data });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get daily summary';
      res.status(500).json({ success: false, message });
    }
  }

  /**
   * GET /api/barber-dashboard/:barberId/monthly?month=3&year=2026
   * Resumen mensual: citas, ganancias, proyección, cancelaciones
   */
  async getMonthlySummary(req: Request, res: Response): Promise<void> {
    try {
      const { barberId } = req.params;
      const now = new Date();
      const month = parseInt(req.query.month as string) || now.getMonth() + 1;
      const year  = parseInt(req.query.year  as string) || now.getFullYear();

      if (month < 1 || month > 12) {
        res.status(400).json({ success: false, message: 'Month must be between 1 and 12' });
        return;
      }

      const data = await barberDashboardService.getMonthlySummary(barberId, month, year);
      res.status(200).json({ success: true, data });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get monthly summary';
      res.status(500).json({ success: false, message });
    }
  }

  /**
   * GET /api/barber-dashboard/:barberId/revenue-chart?period=monthly
   * Gráfico de ingresos: últimas 4 semanas (weekly) o 6 meses (monthly)
   */
  async getRevenueChart(req: Request, res: Response): Promise<void> {
    try {
      const { barberId } = req.params;
      const period = (req.query.period as string) === 'weekly' ? 'weekly' : 'monthly';
      const data = await barberDashboardService.getRevenueChart(barberId, period);
      res.status(200).json({ success: true, data });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get revenue chart';
      res.status(500).json({ success: false, message });
    }
  }

  /**
   * GET /api/barber-dashboard/:barberId/top-services?month=3&year=2026&limit=5
   * Top servicios más vendidos
   */
  async getTopServices(req: Request, res: Response): Promise<void> {
    try {
      const { barberId } = req.params;
      const limit = parseInt(req.query.limit as string) || 5;
      const month = req.query.month ? parseInt(req.query.month as string) : undefined;
      const year  = req.query.year  ? parseInt(req.query.year  as string) : undefined;

      const data = await barberDashboardService.getTopServices(barberId, limit, month, year);
      res.status(200).json({ success: true, data });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get top services';
      res.status(500).json({ success: false, message });
    }
  }

  /**
   * GET /api/barber-dashboard/:barberId/clients?month=3&year=2026
   * Clientes nuevos vs. fieles, en riesgo de fuga, top clientes
   */
  async getClientStats(req: Request, res: Response): Promise<void> {
    try {
      const { barberId } = req.params;
      const now = new Date();
      const month = parseInt(req.query.month as string) || now.getMonth() + 1;
      const year  = parseInt(req.query.year  as string) || now.getFullYear();

      const data = await barberDashboardService.getClientStats(barberId, month, year);
      res.status(200).json({ success: true, data });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get client stats';
      res.status(500).json({ success: false, message });
    }
  }

  /**
   * GET /api/barber-dashboard/:barberId/promotions?month=3&year=2026
   * Rendimiento de cada promoción (usageCount, ROI estimado)
   */
  async getPromotionStats(req: Request, res: Response): Promise<void> {
    try {
      const { barberId } = req.params;
      const month = req.query.month ? parseInt(req.query.month as string) : undefined;
      const year  = req.query.year  ? parseInt(req.query.year  as string) : undefined;

      const data = await barberDashboardService.getPromotionStats(barberId, month, year);
      res.status(200).json({ success: true, data });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get promotion stats';
      res.status(500).json({ success: false, message });
    }
  }

  /**
   * GET /api/barber-dashboard/:barberId/profile-views?days=30
   * Vistas del perfil público (últimos N días)
   */
  async getProfileViews(req: Request, res: Response): Promise<void> {
    try {
      const { barberId } = req.params;
      const days = parseInt(req.query.days as string) || 30;
      const data = await barberDashboardService.getProfileViews(barberId, days);
      res.status(200).json({ success: true, data });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get profile views';
      res.status(500).json({ success: false, message });
    }
  }

  /**
   * GET /api/barber-dashboard/:barberId/peak-hours?month=3&year=2026
   * Horarios con más citas (horas pico)
   */
  async getPeakHours(req: Request, res: Response): Promise<void> {
    try {
      const { barberId } = req.params;
      const now = new Date();
      const month = parseInt(req.query.month as string) || now.getMonth() + 1;
      const year  = parseInt(req.query.year  as string) || now.getFullYear();

      const data = await barberDashboardService.getPeakHours(barberId, month, year);
      res.status(200).json({ success: true, data });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get peak hours';
      res.status(500).json({ success: false, message });
    }
  }

  /**
   * GET /api/barber-dashboard/:barberId/rating-trend
   * Evolución del rating promedio en los últimos 6 meses
   */
  async getRatingTrend(req: Request, res: Response): Promise<void> {
    try {
      const { barberId } = req.params;
      const data = await barberDashboardService.getRatingTrend(barberId);
      res.status(200).json({ success: true, data });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get rating trend';
      res.status(500).json({ success: false, message });
    }
  }

  /**
   * GET /api/barber-dashboard/:barberId/payment-methods?month=3&year=2026
   * Ingresos y citas por método de pago
   */
  async getRevenueByPaymentMethod(req: Request, res: Response): Promise<void> {
    try {
      const { barberId } = req.params;
      const now = new Date();
      const month = parseInt(req.query.month as string) || now.getMonth() + 1;
      const year  = parseInt(req.query.year  as string) || now.getFullYear();

      const data = await barberDashboardService.getRevenueByPaymentMethod(barberId, month, year);
      res.status(200).json({ success: true, data });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get revenue by payment method';
      res.status(500).json({ success: false, message });
    }
  }

  /**
   * GET /api/barber-dashboard/:barberId/reviews/distribution
   * Distribución de reseñas por estrellas (1★ a 5★)
   */
  async getReviewDistribution(req: Request, res: Response): Promise<void> {
    try {
      const { barberId } = req.params;
      const data = await barberDashboardService.getReviewDistribution(barberId);
      res.status(200).json({ success: true, data });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get review distribution';
      res.status(500).json({ success: false, message });
    }
  }

  /**
   * GET /api/barber-dashboard/:barberId/revenue-by-weekday?month=3&year=2026
   * Ingresos por día de la semana (Lun-Dom)
   */
  async getRevenueByDayOfWeek(req: Request, res: Response): Promise<void> {
    try {
      const { barberId } = req.params;
      const now = new Date();
      const month = parseInt(req.query.month as string) || now.getMonth() + 1;
      const year  = parseInt(req.query.year  as string) || now.getFullYear();

      const data = await barberDashboardService.getRevenueByDayOfWeek(barberId, month, year);
      res.status(200).json({ success: true, data });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get revenue by day of week';
      res.status(500).json({ success: false, message });
    }
  }
}

export default new BarberDashboardController();
