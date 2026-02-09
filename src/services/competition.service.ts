import prisma from '../config/prisma';
import { config } from '../config/env';
import { CompetitionPeriodStatus } from '@prisma/client';

const POINTS_PER_APPOINTMENT = config.competition.pointsPerAppointment;
const MAX_POINTS_PER_CLIENT = config.competition.maxPointsPerClientPerPeriod;

export type PeriodWithWinner = {
  id: string;
  name: string | null;
  startDate: Date;
  endDate: Date;
  status: CompetitionPeriodStatus;
  winnerBarberId: string | null;
  winnerName: string | null;
  prize: string | null;
  closedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type LeaderboardEntry = {
  position: number;
  barberId: string;
  barberName: string;
  barberImage: string;
  points: number;
};

export type MyCompetitionResult = {
  position: number;
  points: number;
  totalParticipants: number;
  period: PeriodWithWinner;
};

function mapPeriodToWithWinner(
  period: {
    id: string;
    name: string | null;
    startDate: Date;
    endDate: Date;
    status: CompetitionPeriodStatus;
    winnerBarberId: string | null;
    prize: string | null;
    closedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    winner: { id: string; name: string } | null;
  }
): PeriodWithWinner {
  return {
    id: period.id,
    name: period.name,
    startDate: period.startDate,
    endDate: period.endDate,
    status: period.status,
    winnerBarberId: period.winnerBarberId,
    winnerName: period.winner?.name ?? null,
    prize: period.prize ?? null,
    closedAt: period.closedAt ?? null,
    createdAt: period.createdAt,
    updatedAt: period.updatedAt,
  };
}

class CompetitionService {
  /**
   * Recomputes points for a period. Only completed appointments with verified users count.
   * Each appointment counts only for its barber and only in the period that contains appointment.date.
   */
  async recomputePeriodPoints(periodId: string): Promise<void> {
    const period = await prisma.competitionPeriod.findUnique({
      where: { id: periodId },
      select: { id: true, startDate: true, endDate: true, status: true },
    });
    if (!period) throw new Error('Period not found');
    if (period.status === CompetitionPeriodStatus.CLOSED) {
      throw new Error('No se puede recalcular un periodo ya cerrado. Las puntuaciones quedaron guardadas al cerrar.');
    }

    const start = new Date(period.startDate);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(period.endDate);
    end.setUTCHours(23, 59, 59, 999);

    const appointments = await prisma.appointment.findMany({
      where: {
        status: 'COMPLETED',
        userId: { not: null },
        date: { gte: start, lte: end },
      },
      include: {
        user: { select: { phoneVerifiedAt: true } },
      },
    });

    console.log(`[Competition] Found ${appointments.length} completed appointments for period ${periodId}`);
    if (appointments.length > 0) {
      console.log(`[Competition] details: ${JSON.stringify(appointments.map(a => ({ id: a.id, userId: a.userId, verified: a.user?.phoneVerifiedAt })))}`);
    }

    const validAppointments = appointments.filter(
      (a) => a.user?.phoneVerifiedAt != null
    );

    const pointsByBarber = new Map<string, number>();
    const countByBarberClient = new Map<string, Map<string, number>>();

    for (const a of validAppointments) {
      const barberId = a.barberId;
      const userId = a.userId!;
      const barberKey = barberId;
      if (!countByBarberClient.has(barberKey)) {
        countByBarberClient.set(barberKey, new Map());
      }
      const clientCounts = countByBarberClient.get(barberKey)!;
      const current = clientCounts.get(userId) ?? 0;
      const cap = MAX_POINTS_PER_CLIENT ?? Infinity;
      if (cap > 0 && current >= cap) continue;
      clientCounts.set(userId, current + 1);
      pointsByBarber.set(barberId, (pointsByBarber.get(barberId) ?? 0) + POINTS_PER_APPOINTMENT);
    }

    const barberIds = Array.from(pointsByBarber.keys());
    await prisma.barberPeriodPoints.deleteMany({
      where: { periodId },
    });
    if (barberIds.length > 0) {
      await prisma.barberPeriodPoints.createMany({
        data: barberIds.map((barberId) => ({
          barberId,
          periodId,
          points: pointsByBarber.get(barberId)!,
        })),
      });
    }
  }

  async getPeriods(params?: { status?: CompetitionPeriodStatus }): Promise<PeriodWithWinner[]> {
    const where = params?.status ? { status: params.status } : {};
    const orderBy =
      params?.status === CompetitionPeriodStatus.CLOSED
        ? { endDate: 'desc' as const }
        : { startDate: 'desc' as const };
    const periods = await prisma.competitionPeriod.findMany({
      where,
      orderBy,
      include: {
        winner: { select: { id: true, name: true } },
      },
    });
    const mapped = periods.map((p) => mapPeriodToWithWinner(p));
    if (params?.status === CompetitionPeriodStatus.CLOSED) {
      mapped.sort((a, b) => {
        if (a.closedAt && b.closedAt) return b.closedAt.getTime() - a.closedAt.getTime();
        if (a.closedAt) return -1;
        if (b.closedAt) return 1;
        return 0;
      });
    }
    return mapped;
  }

  async getCurrentPeriod(): Promise<PeriodWithWinner | null> {
    const period = await prisma.competitionPeriod.findFirst({
      where: { status: CompetitionPeriodStatus.ACTIVE },
      orderBy: { startDate: 'desc' },
      include: {
        winner: { select: { id: true, name: true } },
      },
    });
    if (!period) return null;
    return mapPeriodToWithWinner(period);
  }

  async getPeriodById(periodId: string): Promise<PeriodWithWinner | null> {
    const period = await prisma.competitionPeriod.findUnique({
      where: { id: periodId },
      include: {
        winner: { select: { id: true, name: true } },
      },
    });
    if (!period) return null;
    return mapPeriodToWithWinner(period);
  }

  async getLeaderboard(
    periodId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ entries: LeaderboardEntry[]; total: number }> {
    const period = await prisma.competitionPeriod.findUnique({
      where: { id: periodId },
      select: { status: true, finalStandingsSnapshot: true },
    });
    if (period?.status === CompetitionPeriodStatus.CLOSED && period.finalStandingsSnapshot) {
      const snapshot = period.finalStandingsSnapshot as LeaderboardEntry[];
      if (Array.isArray(snapshot) && snapshot.length > 0) {
        const total = snapshot.length;
        const entries = snapshot.slice(offset, offset + limit);
        return { entries, total };
      }
    }
    const [rows, total] = await Promise.all([
      prisma.barberPeriodPoints.findMany({
        where: { periodId },
        orderBy: { points: 'desc' },
        take: limit,
        skip: offset,
        include: {
          barber: { select: { id: true, name: true, image: true } },
        },
      }),
      prisma.barberPeriodPoints.count({ where: { periodId } }),
    ]);
    const entries: LeaderboardEntry[] = rows.map((r, i) => ({
      position: offset + i + 1,
      barberId: r.barber.id,
      barberName: r.barber.name,
      barberImage: r.barber.image ?? '',
      points: r.points,
    }));
    return { entries, total };
  }

  async getLastWinner(): Promise<{
    barberId: string;
    barberName: string;
    periodName: string | null;
    periodId: string;
  } | null> {
    const period = await prisma.competitionPeriod.findFirst({
      where: {
        status: CompetitionPeriodStatus.CLOSED,
        winnerBarberId: { not: null },
      },
      orderBy: { endDate: 'desc' },
      include: {
        winner: { select: { id: true, name: true } },
      },
    });
    if (!period?.winner) return null;
    return {
      barberId: period.winner.id,
      barberName: period.winner.name,
      periodName: period.name,
      periodId: period.id,
    };
  }

  async getBarberTopPositions(barberId: string): Promise<{
    top1: number;
    top2: number;
    top3: number;
    isLastWinner: boolean;
  }> {
    const allClosedPeriods = await prisma.competitionPeriod.findMany({
      where: {
        status: CompetitionPeriodStatus.CLOSED,
      },
      orderBy: { endDate: 'desc' },
      select: {
        id: true,
        finalStandingsSnapshot: true,
        winnerBarberId: true,
      },
    });

    // Filter periods that have snapshots
    const closedPeriods = allClosedPeriods.filter(p => p.finalStandingsSnapshot != null);

    // Only use the most recent closed period
    if (closedPeriods.length === 0) {
      return { top1: 0, top2: 0, top3: 0, isLastWinner: false };
    }

    const mostRecentPeriod = closedPeriods[0];
    const snapshot = mostRecentPeriod.finalStandingsSnapshot as LeaderboardEntry[] | null;

    if (!Array.isArray(snapshot) || snapshot.length === 0) {
      return { top1: 0, top2: 0, top3: 0, isLastWinner: false };
    }

    const entry = snapshot.find((e) => e.barberId === barberId);
    if (!entry || entry.position < 1 || entry.position > 3) {
      return { top1: 0, top2: 0, top3: 0, isLastWinner: false };
    }

    const isLastWinner = entry.position === 1 && mostRecentPeriod.winnerBarberId === barberId;

    if (entry.position === 1) {
      return { top1: 1, top2: 0, top3: 0, isLastWinner };
    } else if (entry.position === 2) {
      return { top1: 0, top2: 1, top3: 0, isLastWinner: false };
    } else if (entry.position === 3) {
      return { top1: 0, top2: 0, top3: 1, isLastWinner: false };
    }

    return { top1: 0, top2: 0, top3: 0, isLastWinner: false };
  }

  async getMyResult(periodId: string, barberId: string): Promise<MyCompetitionResult | null> {
    const period = await this.getPeriodById(periodId);
    if (!period) return null;
    const periodWithSnapshot = await prisma.competitionPeriod.findUnique({
      where: { id: periodId },
      select: { status: true, finalStandingsSnapshot: true },
    });
    if (
      periodWithSnapshot?.status === CompetitionPeriodStatus.CLOSED &&
      periodWithSnapshot.finalStandingsSnapshot
    ) {
      const snapshot = periodWithSnapshot.finalStandingsSnapshot as LeaderboardEntry[];
      const entry = snapshot.find((e) => e.barberId === barberId);
      if (!entry) return null;
      return {
        position: entry.position,
        points: entry.points,
        totalParticipants: snapshot.length,
        period,
      };
    }
    const [myPoints, allPoints] = await Promise.all([
      prisma.barberPeriodPoints.findUnique({
        where: { barberId_periodId: { barberId, periodId } },
      }),
      prisma.barberPeriodPoints.findMany({
        where: { periodId },
        orderBy: { points: 'desc' },
        select: { barberId: true, points: true },
      }),
    ]);
    if (!myPoints) return null;
    const position = allPoints.findIndex((p) => p.barberId === barberId) + 1;
    if (position === 0) return null;
    return {
      position,
      points: myPoints.points,
      totalParticipants: allPoints.length,
      period,
    };
  }

  async createPeriod(data: {
    name?: string;
    startDate: Date;
    endDate: Date;
    status?: CompetitionPeriodStatus;
    prize?: string | null;
  }): Promise<PeriodWithWinner> {
    const period = await prisma.competitionPeriod.create({
      data: {
        name: data.name ?? null,
        startDate: data.startDate,
        endDate: data.endDate,
        status: data.status ?? CompetitionPeriodStatus.DRAFT,
        prize: data.prize ?? null,
      },
      include: {
        winner: { select: { id: true, name: true } },
      },
    });
    return mapPeriodToWithWinner(period);
  }

  async updatePeriod(
    periodId: string,
    data: { name?: string; startDate?: Date; endDate?: Date; status?: CompetitionPeriodStatus; prize?: string | null }
  ): Promise<PeriodWithWinner | null> {
    const period = await prisma.competitionPeriod.update({
      where: { id: periodId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.startDate !== undefined && { startDate: data.startDate }),
        ...(data.endDate !== undefined && { endDate: data.endDate }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.prize !== undefined && { prize: data.prize }),
      },
      include: {
        winner: { select: { id: true, name: true } },
      },
    });
    return mapPeriodToWithWinner(period);
  }

  async closePeriod(periodId: string): Promise<PeriodWithWinner | null> {
    // Guardar el ranking actual (sin recalcular): así se conservan los puntos
    // que haya ahora (recalculados antes por el admin o de un seed).
    const { entries: fullStandings } = await this.getLeaderboard(periodId, 5000, 0);
    const first = fullStandings[0];
    const period = await prisma.competitionPeriod.update({
      where: { id: periodId },
      data: {
        status: CompetitionPeriodStatus.CLOSED,
        winnerBarberId: first?.barberId ?? null,
        closedAt: new Date(),
        finalStandingsSnapshot: fullStandings as unknown as object,
      },
      include: {
        winner: { select: { id: true, name: true } },
      },
    });
    return mapPeriodToWithWinner(period);
  }

  async getHelpRules(): Promise<string[]> {
    const rows = await prisma.competitionHelpRule.findMany({
      orderBy: { sortOrder: 'asc' },
      select: { content: true },
    });
    return rows.map((r) => r.content);
  }

  async setHelpRules(rules: string[]): Promise<void> {
    await prisma.$transaction([
      prisma.competitionHelpRule.deleteMany({}),
      ...rules.map((content, i) =>
        prisma.competitionHelpRule.create({
          data: { content, sortOrder: i },
        })
      ),
    ]);
  }

  async deletePeriod(periodId: string): Promise<void> {
    const period = await prisma.competitionPeriod.findUnique({
      where: { id: periodId },
      select: { status: true },
    });
    if (!period) throw new Error('Period not found');
    if (period.status !== CompetitionPeriodStatus.DRAFT) {
      throw new Error('Solo se pueden eliminar periodos en estado Borrador');
    }
    await prisma.competitionPeriod.delete({ where: { id: periodId } });
  }
  async handleAppointmentCompletion(appointmentId: string): Promise<void> {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: { date: true, status: true },
    });

    if (!appointment || appointment.status !== 'COMPLETED') return;

    // Find active or just closed period that covers this date
    // We fetch candidate periods (Active or Closed) and check dates in Javascript 
    // to avoid timezone/time-component issues with Prisma queries
    const candidatePeriods = await prisma.competitionPeriod.findMany({
      where: {
        status: { in: ['ACTIVE', 'CLOSED'] }
      }
    });

    const appointmentDate = new Date(appointment.date);

    // Find matching period: Period Start <= Appointment Date <= Period End
    // We normalize to ignore time for the comparison if needed, 
    // but typically appointment.date is 00:00. 
    // We want: startOfPeriodDay <= appointmentDate <= endOfPeriodDay

    const period = candidatePeriods.find(p => {
      const start = new Date(p.startDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(p.endDate);
      end.setHours(23, 59, 59, 999);

      return appointmentDate >= start && appointmentDate <= end;
    });

    if (period) {
      console.log(`[Competition] Recomputing points for period ${period.id} due to appointment ${appointmentId}`);
      await this.recomputePeriodPoints(period.id);
    } else {
      console.log(`[Competition] No period found covering appointment date ${appointmentDate.toISOString()}`);
    }
  }
}

export default new CompetitionService();
