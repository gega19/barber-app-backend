import prisma from '../config/prisma';

export interface AnalyticsEventData {
  eventType: string;
  eventName: string;
  platform: 'app' | 'landing' | 'backend';
  userId?: string | null;
  sessionId?: string | null;
  properties?: Record<string, any>;
  metadata?: Record<string, any>;
}

export class AnalyticsService {
  /**
   * Registra un solo evento de analytics
   */
  async trackEvent(data: AnalyticsEventData): Promise<void> {
    try {
      await prisma.analyticsEvent.create({
        data: {
          eventType: data.eventType,
          eventName: data.eventName,
          platform: data.platform,
          userId: data.userId || null,
          sessionId: data.sessionId || null,
          properties: data.properties || {},
          metadata: data.metadata || {},
        },
      });
    } catch (error) {
      console.error('Error tracking analytics event:', error);
      // No lanzar error para no interrumpir el flujo principal
    }
  }

  /**
   * Registra múltiples eventos en batch (más eficiente)
   */
  async trackBatch(events: AnalyticsEventData[]): Promise<{ success: boolean; count: number }> {
    if (events.length === 0) {
      return { success: true, count: 0 };
    }

    try {
      // Insertar todos los eventos en una sola transacción
      await prisma.$transaction(
        events.map((event) =>
          prisma.analyticsEvent.create({
            data: {
              eventType: event.eventType,
              eventName: event.eventName,
              platform: event.platform,
              userId: event.userId || null,
              sessionId: event.sessionId || null,
              properties: event.properties || {},
              metadata: event.metadata || {},
            },
          })
        )
      );

      return { success: true, count: events.length };
    } catch (error) {
      console.error('Error tracking analytics batch:', error);
      return { success: false, count: 0 };
    }
  }

  /**
   * Obtiene eventos con filtros opcionales
   */
  async getEvents(filters: {
    eventType?: string;
    eventName?: string;
    platform?: string;
    userId?: string;
    sessionId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (filters.eventType) {
      where.eventType = filters.eventType;
    }

    if (filters.eventName) {
      where.eventName = filters.eventName;
    }

    if (filters.platform) {
      where.platform = filters.platform;
    }

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.sessionId) {
      where.sessionId = filters.sessionId;
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    const [events, total] = await Promise.all([
      prisma.analyticsEvent.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        take: filters.limit || 100,
        skip: filters.offset || 0,
      }),
      prisma.analyticsEvent.count({ where }),
    ]);

    return {
      events,
      total,
      limit: filters.limit || 100,
      offset: filters.offset || 0,
    };
  }

  /**
   * Obtiene estadísticas agregadas de eventos
   */
  async getEventStats(filters: {
    startDate?: Date;
    endDate?: Date;
    platform?: string;
  }) {
    const where: any = {};

    if (filters.platform) {
      where.platform = filters.platform;
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    // Obtener total de eventos
    const totalEvents = await prisma.analyticsEvent.count({ where });

    // Obtener eventos por tipo
    const eventsByType = await prisma.analyticsEvent.groupBy({
      by: ['eventType'],
      where,
      _count: true,
    });

    // Obtener eventos por nombre (top 10)
    const eventsByName = await prisma.analyticsEvent.groupBy({
      by: ['eventName'],
      where,
      _count: true,
      orderBy: {
        _count: {
          eventName: 'desc',
        },
      },
      take: 10,
    });

    // Obtener eventos por plataforma
    const eventsByPlatform = await prisma.analyticsEvent.groupBy({
      by: ['platform'],
      where,
      _count: true,
    });

    return {
      totalEvents,
      eventsByType: eventsByType.map((e) => ({
        eventType: e.eventType,
        count: e._count,
      })),
      topEvents: eventsByName.map((e) => ({
        eventName: e.eventName,
        count: e._count,
      })),
      eventsByPlatform: eventsByPlatform.map((e) => ({
        platform: e.platform,
        count: e._count,
      })),
    };
  }
}

export default new AnalyticsService();

