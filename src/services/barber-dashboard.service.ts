import prisma from '../config/prisma';

// ─────────────────────────────────────────────
// Return types
// ─────────────────────────────────────────────

export interface DailySummary {
  date: string;
  totalAppointments: number;
  completed: number;
  pending: number;
  cancelled: number;
  revenue: number;
  avgTicket: number;
  appointments: Array<{
    id: string;
    time: string;
    status: string;
    clientName: string;
    serviceName: string | null;
    servicePrice: number | null;
  }>;
}

export interface MonthlySummary {
  month: number;
  year: number;
  totalAppointments: number;
  completed: number;
  cancelled: number;
  pending: number;
  revenue: number;
  avgTicket: number;
  cancellationRate: number;
  revenueVsPrevMonth: number | null; // % change
  projectedRevenue: number | null;   // projection for current month
  soldOutDays: number;               // days where schedule was full
  occupancyRate: number;             // % slots used
}

export interface RevenueChartPoint {
  label: string;
  revenue: number;
  appointments: number;
}

export interface TopService {
  serviceId: string;
  serviceName: string;
  count: number;
  revenue: number;
  percentage: number;
}

export interface ClientStats {
  newClients: number;
  loyalClients: number;
  totalUniqueClients: number;
  conversionRate: number | null; // % of new clients that come back (all-time)
  avgRevisitDays: number | null; // avg days between visits
  atRiskClients: Array<{
    userId: string;
    clientName: string;
    lastVisit: string;
    daysSinceLastVisit: number;
    totalVisits: number;
  }>;
  topClients: Array<{
    userId: string;
    clientName: string;
    totalVisits: number;
    totalSpent: number;
    lastVisit: string;
  }>;
}

export interface PromotionStat {
  promotionId: string;
  title: string;
  code: string;
  discount: number | null;
  discountAmount: number | null;
  usageCount: number;
  isActive: boolean;
  validFrom: string;
  validUntil: string;
}

export interface ProfileViewsStat {
  totalViews: number;
  dailyViews: Array<{ date: string; count: number }>;
}

export interface PeakHour {
  hour: string;
  displayHour: string;
  count: number;
  percentage: number;
}

export interface RatingTrendPoint {
  month: string;
  avgRating: number;
  reviewCount: number;
}

export interface RevenueByPaymentMethod {
  paymentMethod: string;
  count: number;
  revenue: number;
  percentage: number;
}

export interface ReviewDistribution {
  stars: number;
  count: number;
  percentage: number;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function getMonthRange(month: number, year: number): { start: Date; end: Date } {
  const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const end   = new Date(year, month, 0, 23, 59, 59, 999);
  return { start, end };
}

/**
 * Build a UTC day range from a YYYY-MM-DD string.
 * This avoids any timezone shifting: 2026-03-04 always means
 * 2026-03-04T00:00:00.000Z → 2026-03-04T23:59:59.999Z
 */
function getDayRange(dateStr: string): { start: Date; end: Date } {
  const [year, month, day] = dateStr.split('-').map(Number);
  const start = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  const end   = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
  return { start, end };
}

const MONTH_NAMES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

// ─────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────

export class BarberDashboardService {

  // ── 1. DAILY SUMMARY ──────────────────────────────────────────────────────
  async getDailySummary(barberId: string, dateStr: string | null): Promise<DailySummary> {
    // If no date provided, use today in UTC
    const today = new Date();
    const todayStr = `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, '0')}-${String(today.getUTCDate()).padStart(2, '0')}`;
    const { start, end } = getDayRange(dateStr ?? todayStr);
    const usedDateStr = dateStr ?? todayStr;

    const appointments = await prisma.appointment.findMany({
      where: { barberId, date: { gte: start, lte: end } },
      include: {
        service: { select: { name: true, price: true } },
        user:    { select: { name: true } },
      },
      orderBy: { time: 'asc' },
    });

    const completed  = appointments.filter(a => a.status === 'COMPLETED');
    const pending    = appointments.filter(a => a.status === 'PENDING' || a.status === 'CONFIRMED');
    const cancelled  = appointments.filter(a => a.status === 'CANCELLED');

    const revenue = completed.reduce((sum, a) => sum + (a.service?.price ?? 0), 0);

    return {
      date: usedDateStr,
      totalAppointments: appointments.length,
      completed: completed.length,
      pending: pending.length,
      cancelled: cancelled.length,
      revenue: Math.round(revenue * 100) / 100,
      avgTicket: completed.length > 0
        ? Math.round((revenue / completed.length) * 100) / 100
        : 0,
      appointments: appointments.map(a => ({
        id: a.id,
        time: a.time,
        status: a.status,
        clientName: a.user?.name ?? a.clientName ?? 'Cliente Invitado',
        serviceName: a.service?.name ?? null,
        servicePrice: a.service?.price ?? null,
      })),
    };
  }

  // ── 2. MONTHLY SUMMARY ────────────────────────────────────────────────────
  async getMonthlySummary(barberId: string, month: number, year: number): Promise<MonthlySummary> {
    const { start, end } = getMonthRange(month, year);

    // Mes actual
    const appointments = await prisma.appointment.findMany({
      where: { barberId, date: { gte: start, lte: end } },
      include: { service: { select: { price: true } } },
    });

    const completed = appointments.filter(a => a.status === 'COMPLETED');
    const cancelled = appointments.filter(a => a.status === 'CANCELLED');
    const pending   = appointments.filter(a => a.status === 'PENDING' || a.status === 'CONFIRMED');
    const revenue   = completed.reduce((sum, a) => sum + (a.service?.price ?? 0), 0);

    // Mes anterior para comparación
    const prevMonth  = month === 1 ? 12 : month - 1;
    const prevYear   = month === 1 ? year - 1 : year;
    const { start: prevStart, end: prevEnd } = getMonthRange(prevMonth, prevYear);

    const prevAppointments = await prisma.appointment.findMany({
      where: {
        barberId,
        status: 'COMPLETED',
        date: { gte: prevStart, lte: prevEnd },
      },
      include: { service: { select: { price: true } } },
    });
    const prevRevenue = prevAppointments.reduce((sum, a) => sum + (a.service?.price ?? 0), 0);

    let revenueVsPrevMonth: number | null = null;
    if (prevRevenue > 0) {
      revenueVsPrevMonth = Math.round(((revenue - prevRevenue) / prevRevenue) * 1000) / 10;
    }

    // Proyección (solo si es el mes actual)
    let projectedRevenue: number | null = null;
    const now = new Date();
    if (year === now.getFullYear() && month === now.getMonth() + 1) {
      const dayOfMonth   = now.getDate();
      const daysInMonth  = new Date(year, month, 0).getDate();
      if (dayOfMonth > 0 && revenue > 0) {
        projectedRevenue = Math.round((revenue / dayOfMonth) * daysInMonth * 100) / 100;
      }
    }

    // Tasa de cancelación
    const cancellationRate = appointments.length > 0
      ? Math.round((cancelled.length / appointments.length) * 1000) / 10
      : 0;

    // Días sold-out: agrupar citas por fecha y contar fechas con 8+ citas
    const byDate = new Map<string, number>();
    appointments.forEach(a => {
      if (a.status !== 'CANCELLED') {
        const key = a.date.toISOString().split('T')[0];
        byDate.set(key, (byDate.get(key) ?? 0) + 1);
      }
    });
    const soldOutDays = Array.from(byDate.values()).filter(n => n >= 8).length;

    // Tasa de ocupación estimada (asumimos ~8 slots/día, 22 días hábiles)
    const workingDaysInMonth = 22;
    const slotsAvailable = workingDaysInMonth * 8;
    const occupancyRate = Math.round(
      ((appointments.filter(a => a.status !== 'CANCELLED').length / slotsAvailable) * 100 * 10) / 10
    );

    return {
      month,
      year,
      totalAppointments: appointments.length,
      completed: completed.length,
      cancelled: cancelled.length,
      pending: pending.length,
      revenue: Math.round(revenue * 100) / 100,
      avgTicket: completed.length > 0
        ? Math.round((revenue / completed.length) * 100) / 100
        : 0,
      cancellationRate,
      revenueVsPrevMonth,
      projectedRevenue,
      soldOutDays,
      occupancyRate,
    };
  }

  // ── 3. REVENUE CHART ──────────────────────────────────────────────────────
  async getRevenueChart(barberId: string, period: 'weekly' | 'monthly'): Promise<RevenueChartPoint[]> {
    if (period === 'weekly') {
      // Últimas 4 semanas, agrupado por día
      const since = new Date();
      since.setDate(since.getDate() - 27);
      since.setHours(0, 0, 0, 0);

      const appointments = await prisma.appointment.findMany({
        where: {
          barberId,
          status: 'COMPLETED',
          date: { gte: since },
        },
        include: { service: { select: { price: true } } },
      });

      const map = new Map<string, { revenue: number; count: number }>();
      appointments.forEach(a => {
        const key = a.date.toISOString().split('T')[0];
        const val = map.get(key) ?? { revenue: 0, count: 0 };
        map.set(key, { revenue: val.revenue + (a.service?.price ?? 0), count: val.count + 1 });
      });

      const result: RevenueChartPoint[] = [];
      for (let i = 27; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        const val = map.get(key) ?? { revenue: 0, count: 0 };
        result.push({
          label: `${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`,
          revenue: Math.round(val.revenue * 100) / 100,
          appointments: val.count,
        });
      }
      return result;
    }

    // monthly: últimos 6 meses
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const appointments = await prisma.appointment.findMany({
      where: {
        barberId,
        status: 'COMPLETED',
        date: { gte: sixMonthsAgo },
      },
      include: { service: { select: { price: true } } },
    });

    const map = new Map<string, { revenue: number; count: number }>();
    appointments.forEach(a => {
      const key = `${a.date.getFullYear()}-${String(a.date.getMonth() + 1).padStart(2, '0')}`;
      const val = map.get(key) ?? { revenue: 0, count: 0 };
      map.set(key, { revenue: val.revenue + (a.service?.price ?? 0), count: val.count + 1 });
    });

    const result: RevenueChartPoint[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const val = map.get(key) ?? { revenue: 0, count: 0 };
      result.push({
        label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`,
        revenue: Math.round(val.revenue * 100) / 100,
        appointments: val.count,
      });
    }
    return result;
  }

  // ── 4. TOP SERVICES ───────────────────────────────────────────────────────
  async getTopServices(
    barberId: string,
    limit = 5,
    month?: number,
    year?: number,
  ): Promise<TopService[]> {
    const where: any = { barberId, status: 'COMPLETED', serviceId: { not: null } };

    if (month && year) {
      const { start, end } = getMonthRange(month, year);
      where.date = { gte: start, lte: end };
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: { service: { select: { id: true, name: true, price: true } } },
    });

    const serviceMap = new Map<string, { name: string; count: number; revenue: number }>();
    appointments.forEach(a => {
      if (!a.service) return;
      const val = serviceMap.get(a.service.id) ?? { name: a.service.name, count: 0, revenue: 0 };
      serviceMap.set(a.service.id, {
        name: a.service.name,
        count: val.count + 1,
        revenue: val.revenue + (a.service.price ?? 0),
      });
    });

    const total = appointments.length;
    return Array.from(serviceMap.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, limit)
      .map(([id, val]) => ({
        serviceId: id,
        serviceName: val.name,
        count: val.count,
        revenue: Math.round(val.revenue * 100) / 100,
        percentage: total > 0 ? Math.round((val.count / total) * 1000) / 10 : 0,
      }));
  }

  // ── 5. CLIENT STATS ───────────────────────────────────────────────────────
  async getClientStats(barberId: string, month: number, year: number): Promise<ClientStats> {
    const { start, end } = getMonthRange(month, year);

    // Citas completadas del mes para clientes registrados
    const monthAppointments = await prisma.appointment.findMany({
      where: {
        barberId,
        status: 'COMPLETED',
        date: { gte: start, lte: end },
        userId: { not: null },
      },
      include: {
        user: { select: { id: true, name: true } },
        service: { select: { price: true } },
      },
    });

    const uniqueThisMonth = new Set(monthAppointments.map(a => a.userId!));

    // De esos, cuáles son nuevos (primera cita con este barbero en este mes)
    let newClients = 0;
    for (const userId of uniqueThisMonth) {
      const firstEver = await prisma.appointment.findFirst({
        where: { barberId, userId, status: 'COMPLETED' },
        orderBy: { date: 'asc' },
      });
      if (firstEver && firstEver.date >= start && firstEver.date <= end) {
        newClients++;
      }
    }

    const loyalClients = uniqueThisMonth.size - newClients;

    // Tasa conversión: de todos los new clients históricos, cuántos volvieron
    const allNewClientsEver = await prisma.appointment.groupBy({
      by: ['userId'],
      where: { barberId, userId: { not: null }, status: 'COMPLETED' },
      having: { userId: { _count: { gte: 1 } } },
    });

    let returnedCount = 0;
    for (const { userId } of allNewClientsEver) {
      if (!userId) continue;
      const count = await prisma.appointment.count({
        where: { barberId, userId, status: 'COMPLETED' },
      });
      if (count >= 2) returnedCount++;
    }

    const conversionRate = allNewClientsEver.length > 0
      ? Math.round((returnedCount / allNewClientsEver.length) * 1000) / 10
      : null;

    // Intervalo promedio de revisita
    let avgRevisitDays: number | null = null;
    const revisitIntervals: number[] = [];
    for (const { userId } of allNewClientsEver) {
      if (!userId) continue;
      const visitDates = await prisma.appointment.findMany({
        where: { barberId, userId, status: 'COMPLETED' },
        select: { date: true },
        orderBy: { date: 'asc' },
      });
      for (let i = 1; i < visitDates.length; i++) {
        const diff = (visitDates[i].date.getTime() - visitDates[i - 1].date.getTime())
          / (1000 * 60 * 60 * 24);
        revisitIntervals.push(diff);
      }
    }
    if (revisitIntervals.length > 0) {
      avgRevisitDays = Math.round(
        (revisitIntervals.reduce((a, b) => a + b, 0) / revisitIntervals.length) * 10
      ) / 10;
    }

    // Clientes en riesgo: fieles con +45 días sin visitar
    const riskThresholdDate = new Date();
    riskThresholdDate.setDate(riskThresholdDate.getDate() - 45);

    const loyalUserIds = allNewClientsEver
      .filter(r => r.userId !== null)
      .map(r => r.userId as string);

    const atRiskClients: ClientStats['atRiskClients'] = [];
    for (const userId of loyalUserIds) {
      const totalVisits = await prisma.appointment.count({
        where: { barberId, userId, status: 'COMPLETED' },
      });
      if (totalVisits < 2) continue;

      const lastVisitRecord = await prisma.appointment.findFirst({
        where: { barberId, userId, status: 'COMPLETED' },
        orderBy: { date: 'desc' },
        include: { user: { select: { name: true } } },
      });

      if (!lastVisitRecord || lastVisitRecord.date > riskThresholdDate) continue;

      const daysSince = Math.floor(
        (Date.now() - lastVisitRecord.date.getTime()) / (1000 * 60 * 60 * 24)
      );
      atRiskClients.push({
        userId,
        clientName: lastVisitRecord.user?.name ?? 'Cliente',
        lastVisit: lastVisitRecord.date.toISOString().split('T')[0],
        daysSinceLastVisit: daysSince,
        totalVisits,
      });
    }
    atRiskClients.sort((a, b) => b.daysSinceLastVisit - a.daysSinceLastVisit);

    // Top 5 clientes
    const clientTotals = new Map<string, { name: string; visits: number; spent: number; lastVisit: Date }>();
    const allCompleted = await prisma.appointment.findMany({
      where: { barberId, status: 'COMPLETED', userId: { not: null } },
      include: {
        user: { select: { id: true, name: true } },
        service: { select: { price: true } },
      },
      orderBy: { date: 'desc' },
    });

    allCompleted.forEach(a => {
      if (!a.userId || !a.user) return;
      const val = clientTotals.get(a.userId) ?? { name: a.user.name, visits: 0, spent: 0, lastVisit: a.date };
      clientTotals.set(a.userId, {
        name: a.user.name,
        visits: val.visits + 1,
        spent: val.spent + (a.service?.price ?? 0),
        lastVisit: val.lastVisit > a.date ? val.lastVisit : a.date,
      });
    });

    const topClients = Array.from(clientTotals.entries())
      .sort((a, b) => b[1].visits - a[1].visits)
      .slice(0, 5)
      .map(([userId, val]) => ({
        userId,
        clientName: val.name,
        totalVisits: val.visits,
        totalSpent: Math.round(val.spent * 100) / 100,
        lastVisit: val.lastVisit.toISOString().split('T')[0],
      }));

    return {
      newClients,
      loyalClients,
      totalUniqueClients: uniqueThisMonth.size,
      conversionRate,
      avgRevisitDays,
      atRiskClients: atRiskClients.slice(0, 10),
      topClients,
    };
  }

  // ── 6. PROMOTION STATS ────────────────────────────────────────────────────
  async getPromotionStats(
    barberId: string,
    month?: number,
    year?: number,
  ): Promise<PromotionStat[]> {
    const promotions = await prisma.promotion.findMany({
      where: { barberId },
      orderBy: { createdAt: 'desc' },
    });

    if (promotions.length === 0) return [];

    const dateFilter: any = { barberId };
    if (month && year) {
      const { start, end } = getMonthRange(month, year);
      dateFilter.date = { gte: start, lte: end };
    }

    // Para cada promoción, contar citas activas durante su vigencia
    return Promise.all(
      promotions.map(async promo => {
        const usageCount = await prisma.appointment.count({
          where: {
            barberId,
            status: { not: 'CANCELLED' },
            date: {
              gte: promo.validFrom,
              lte: promo.validUntil,
            },
            ...(month && year
              ? (() => {
                  const { start, end } = getMonthRange(month, year);
                  return { date: { gte: start, lte: end } };
                })()
              : {}),
          },
        });

        return {
          promotionId: promo.id,
          title: promo.title,
          code: promo.code,
          discount: promo.discount,
          discountAmount: promo.discountAmount,
          usageCount,
          isActive: promo.isActive,
          validFrom: promo.validFrom.toISOString().split('T')[0],
          validUntil: promo.validUntil.toISOString().split('T')[0],
        };
      })
    );
  }

  // ── 7. PROFILE VIEWS ──────────────────────────────────────────────────────
  async getProfileViews(barberId: string, days = 30): Promise<ProfileViewsStat> {
    const since = new Date();
    since.setDate(since.getDate() - (days - 1));
    since.setHours(0, 0, 0, 0);

    const events = await prisma.analyticsEvent.findMany({
      where: {
        eventName: 'BARBER_PROFILE_VIEW',
        properties: { path: ['barberId'], equals: barberId },
        createdAt: { gte: since },
      },
      select: { createdAt: true },
    });

    const map = new Map<string, number>();
    events.forEach(e => {
      const key = e.createdAt.toISOString().split('T')[0];
      map.set(key, (map.get(key) ?? 0) + 1);
    });

    const dailyViews: ProfileViewsStat['dailyViews'] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      dailyViews.push({ date: key, count: map.get(key) ?? 0 });
    }

    return {
      totalViews: events.length,
      dailyViews,
    };
  }

  // ── 8. PEAK HOURS ─────────────────────────────────────────────────────────
  async getPeakHours(barberId: string, month: number, year: number): Promise<PeakHour[]> {
    const { start, end } = getMonthRange(month, year);

    const appointments = await prisma.appointment.findMany({
      where: {
        barberId,
        status: { not: 'CANCELLED' },
        date: { gte: start, lte: end },
      },
      select: { time: true },
    });

    const map = new Map<string, number>();
    appointments.forEach(a => {
      const hour = a.time.split(':')[0]; // "09" from "09:00"
      map.set(hour, (map.get(hour) ?? 0) + 1);
    });

    const total = appointments.length;
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([hour, count]) => ({
        hour,
        displayHour: `${hour}:00`,
        count,
        percentage: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
      }));
  }

  // ── 9. RATING TREND ───────────────────────────────────────────────────────
  async getRatingTrend(barberId: string): Promise<RatingTrendPoint[]> {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const reviews = await prisma.review.findMany({
      where: { barberId, createdAt: { gte: sixMonthsAgo } },
      select: { rating: true, createdAt: true },
    });

    const map = new Map<string, { sum: number; count: number }>();
    reviews.forEach(r => {
      const key = `${r.createdAt.getFullYear()}-${String(r.createdAt.getMonth() + 1).padStart(2, '0')}`;
      const val = map.get(key) ?? { sum: 0, count: 0 };
      map.set(key, { sum: val.sum + r.rating, count: val.count + 1 });
    });

    const result: RatingTrendPoint[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const val = map.get(key);
      result.push({
        month: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`,
        avgRating: val ? Math.round((val.sum / val.count) * 10) / 10 : 0,
        reviewCount: val?.count ?? 0,
      });
    }
    return result;
  }

  // ── 10. REVENUE BY PAYMENT METHOD ─────────────────────────────────────────
  async getRevenueByPaymentMethod(
    barberId: string,
    month: number,
    year: number,
  ): Promise<RevenueByPaymentMethod[]> {
    const { start, end } = getMonthRange(month, year);

    const appointments = await prisma.appointment.findMany({
      where: {
        barberId,
        status: 'COMPLETED',
        date: { gte: start, lte: end },
        paymentMethod: { not: null },
      },
      include: { service: { select: { price: true } } },
    });

    const methodMap = new Map<string, { count: number; revenue: number }>();
    const paymentMethodIds = [...new Set(appointments.map(a => a.paymentMethod).filter(Boolean))] as string[];

    // Resolve payment method names
    const paymentMethods = await prisma.paymentMethod.findMany({
      where: { id: { in: paymentMethodIds } },
      select: { id: true, name: true },
    });
    const nameById = new Map(paymentMethods.map(pm => [pm.id, pm.name]));

    appointments.forEach(a => {
      if (!a.paymentMethod) return;
      const name = nameById.get(a.paymentMethod) ?? a.paymentMethod;
      const val = methodMap.get(name) ?? { count: 0, revenue: 0 };
      methodMap.set(name, {
        count: val.count + 1,
        revenue: val.revenue + (a.service?.price ?? 0),
      });
    });

    const total = appointments.length;
    return Array.from(methodMap.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .map(([paymentMethod, val]) => ({
        paymentMethod,
        count: val.count,
        revenue: Math.round(val.revenue * 100) / 100,
        percentage: total > 0 ? Math.round((val.count / total) * 1000) / 10 : 0,
      }));
  }

  // ── 11. REVIEW DISTRIBUTION ───────────────────────────────────────────────
  async getReviewDistribution(barberId: string): Promise<ReviewDistribution[]> {
    const reviews = await prisma.review.findMany({
      where: { barberId },
      select: { rating: true },
    });

    const total = reviews.length;
    const map = new Map<number, number>();
    reviews.forEach(r => map.set(r.rating, (map.get(r.rating) ?? 0) + 1));

    return [5, 4, 3, 2, 1].map(stars => {
      const count = map.get(stars) ?? 0;
      return {
        stars,
        count,
        percentage: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
      };
    });
  }

  // ── 12. REVENUE BY DAY OF WEEK ────────────────────────────────────────────
  async getRevenueByDayOfWeek(
    barberId: string,
    month: number,
    year: number,
  ): Promise<Array<{ dayName: string; dayIndex: number; count: number; revenue: number }>> {
    const { start, end } = getMonthRange(month, year);
    const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    const appointments = await prisma.appointment.findMany({
      where: { barberId, status: 'COMPLETED', date: { gte: start, lte: end } },
      include: { service: { select: { price: true } } },
    });

    const map = new Map<number, { count: number; revenue: number }>();
    appointments.forEach(a => {
      const dow = a.date.getDay();
      const val = map.get(dow) ?? { count: 0, revenue: 0 };
      map.set(dow, { count: val.count + 1, revenue: val.revenue + (a.service?.price ?? 0) });
    });

    return [1, 2, 3, 4, 5, 6, 0].map(dow => {
      const val = map.get(dow) ?? { count: 0, revenue: 0 };
      return {
        dayName: DAY_NAMES[dow],
        dayIndex: dow,
        count: val.count,
        revenue: Math.round(val.revenue * 100) / 100,
      };
    });
  }
}

export default new BarberDashboardService();
