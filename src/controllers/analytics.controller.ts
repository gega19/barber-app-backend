import { Request, Response } from 'express';
import analyticsService from '../services/analytics.service';

class AnalyticsController {
  /**
   * Registra un solo evento de analytics
   */
  async trackEvent(req: Request, res: Response): Promise<void> {
    try {
      const { eventType, eventName, platform, userId, sessionId, properties, metadata } = req.body;

      if (!eventType || !eventName || !platform) {
        res.status(400).json({
          success: false,
          message: 'eventType, eventName, and platform are required',
        });
        return;
      }

      await analyticsService.trackEvent({
        eventType,
        eventName,
        platform,
        userId,
        sessionId,
        properties,
        metadata,
      });

      res.status(200).json({
        success: true,
        message: 'Event tracked successfully',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to track event';
      res.status(500).json({
        success: false,
        message,
      });
    }
  }

  /**
   * Registra múltiples eventos en batch
   */
  async trackBatch(req: Request, res: Response): Promise<void> {
    try {
      const { events } = req.body;

      if (!Array.isArray(events) || events.length === 0) {
        res.status(400).json({
          success: false,
          message: 'events array is required and must not be empty',
        });
        return;
      }

      // Validar que cada evento tenga los campos requeridos
      for (const event of events) {
        if (!event.eventType || !event.eventName || !event.platform) {
          res.status(400).json({
            success: false,
            message: 'Each event must have eventType, eventName, and platform',
          });
          return;
        }
      }

      const result = await analyticsService.trackBatch(events);

      res.status(200).json({
        success: result.success,
        message: `Tracked ${result.count} events`,
        count: result.count,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to track batch';
      res.status(500).json({
        success: false,
        message,
      });
    }
  }

  /**
   * Obtiene eventos con filtros opcionales
   */
  async getEvents(req: Request, res: Response): Promise<void> {
    try {
      const {
        eventType,
        eventName,
        platform,
        userId,
        sessionId,
        startDate,
        endDate,
        limit,
        offset,
      } = req.query;

      const filters: any = {};

      if (eventType) filters.eventType = eventType as string;
      if (eventName) filters.eventName = eventName as string;
      if (platform) filters.platform = platform as string;
      if (userId) filters.userId = userId as string;
      if (sessionId) filters.sessionId = sessionId as string;
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);
      if (limit) filters.limit = parseInt(limit as string, 10);
      if (offset) filters.offset = parseInt(offset as string, 10);

      const result = await analyticsService.getEvents(filters);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get events';
      res.status(500).json({
        success: false,
        message,
      });
    }
  }

  /**
   * Obtiene estadísticas agregadas de eventos
   */
  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate, platform } = req.query;

      const filters: any = {};

      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);
      if (platform) filters.platform = platform as string;

      const stats = await analyticsService.getEventStats(filters);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get stats';
      res.status(500).json({
        success: false,
        message,
      });
    }
  }
}

export default new AnalyticsController();

