import prisma from '../config/prisma';
import { validateAndNormalizeInstagram, validateAndNormalizeTikTok } from '../utils/social-media.validator';
import competitionService from './competition.service';

/** Wall score weights (must sum to 1). Tunable for ranking. */
const WALL_SCORE_WEIGHTS = {
  rating: 0.30,
  reviews: 0.20,
  services: 0.18,
  tenure: 0.12,
  profileCompleteness: 0.20,
} as const;

const WALL_SCORE_REVIEWS_CAP = 50;
const WALL_SCORE_TENURE_MONTHS_CAP = 24;

export class BarberService {
  // Cache for total count to avoid unnecessary queries
  private cachedTotal: { count: number; timestamp: number } | null = null;
  private readonly CACHE_TTL = 60000; // 1 minute

  /**
   * Recomputes and persists wallScore for a barber (rating, reviews, services, tenure, profile completeness).
   * Call this whenever barber data that affects the score changes.
   */
  async recomputeWallScore(barberId: string): Promise<void> {
    const barber = await prisma.barber.findUnique({
      where: { id: barberId },
      select: {
        id: true,
        email: true,
        rating: true,
        reviews: true,
        createdAt: true,
        bio: true,
        image: true,
        location: true,
        latitude: true,
        longitude: true,
        slug: true,
        _count: {
          select: {
            services: true,
            availability: true,
            portfolio: true,
          },
        },
      },
    });

    if (!barber) return;

    const user = await prisma.user.findUnique({
      where: { email: barber.email },
      select: { phoneVerifiedAt: true },
    });
    const isBarberVerified = user?.phoneVerifiedAt != null;

    const rating = barber.rating ?? 0;
    const reviewsCount = barber.reviews ?? 0;

    const scoreRating = Math.min(100, (rating / 5) * 100);
    const scoreReviews = Math.min(100, (Math.min(reviewsCount, WALL_SCORE_REVIEWS_CAP) / WALL_SCORE_REVIEWS_CAP) * 100);
    const scoreServices = barber._count.services >= 1 ? 100 : 0;

    const now = new Date();
    const monthsSinceCreated = (now.getTime() - barber.createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
    const scoreTenure = Math.min(100, (Math.min(monthsSinceCreated, WALL_SCORE_TENURE_MONTHS_CAP) / WALL_SCORE_TENURE_MONTHS_CAP) * 100);

    let profileChecks = 0;
    const totalProfileChecks = 8;
    if (barber.bio?.trim()) profileChecks += 1;
    if (barber.image?.trim()) profileChecks += 1;
    if (barber.location?.trim()) profileChecks += 1;
    if ((barber.latitude != null && barber.longitude != null) || (barber.location?.trim() ?? '').length > 0) profileChecks += 1;
    if (barber.slug != null && barber.slug.trim() !== '') profileChecks += 1;
    if (barber._count.availability >= 1) profileChecks += 1;
    if (barber._count.portfolio >= 1) profileChecks += 1;
    if (isBarberVerified) profileChecks += 1;
    const scoreProfile = (profileChecks / totalProfileChecks) * 100;

    const wallScore = Math.round(
      (scoreRating * WALL_SCORE_WEIGHTS.rating +
        scoreReviews * WALL_SCORE_WEIGHTS.reviews +
        scoreServices * WALL_SCORE_WEIGHTS.services +
        scoreTenure * WALL_SCORE_WEIGHTS.tenure +
        scoreProfile * WALL_SCORE_WEIGHTS.profileCompleteness) * 100
    ) / 100;

    await prisma.barber.update({
      where: { id: barberId },
      data: {
        wallScore: Math.max(0, Math.min(100, wallScore)),
        wallScoreUpdatedAt: new Date(),
      },
    });
  }

  /**
   * Recomputes wallScore for all barbers. Run once after deploy for backfill.
   */
  async recomputeAllWallScores(): Promise<void> {
    const barbers = await prisma.barber.findMany({
      select: { id: true },
    });
    for (const { id } of barbers) {
      await this.recomputeWallScore(id);
    }
  }

  async getBarbers() {
    const barbers = await prisma.barber.findMany({
      orderBy: {
        rating: 'desc',
      },
    });

    // Batch fetch all users by emails (1 query instead of N)
    const emails = barbers.map(b => b.email);
    const users = await prisma.user.findMany({
      where: { email: { in: emails } },
      select: { email: true, avatar: true, avatarSeed: true, phone: true },
    });

    // Create lookup map for O(1) access
    const userMap = new Map(users.map(u => [u.email, u]));

    // Get Top positions for all barbers in batch
    const barberIds = barbers.map(b => b.id);
    const topPositionsMap = await this._getTopPositionsForBarbers(barberIds);

    // Enrich barbers with user data and top positions
    return barbers.map((barber: any) => {
      const user = userMap.get(barber.email);
      const topPositions = topPositionsMap.get(barber.id) ?? { top1: 0, top2: 0, top3: 0, isLastWinner: false };
      return {
        ...barber,
        avatar: user?.avatar || barber.image,
        avatarSeed: user?.avatarSeed ?? `${barber.name}-${barber.id.slice(-6)}`,
        phone: user?.phone,
        isLastWinner: topPositions.isLastWinner,
        top1Count: topPositions.top1,
        top2Count: topPositions.top2,
        top3Count: topPositions.top3,
      };
    });
  }

  /**
   * Gets best barbers with pagination
   * @param limit - Number of items per page
   * @param offset - Starting position
   * @returns Object with barbers array and total count
   */
  async getBestBarbers(limit: number = 10, offset: number = 0) {
    // Use cached total if available and not expired
    const now = Date.now();
    let totalCount: number;

    if (this.cachedTotal && now - this.cachedTotal.timestamp < this.CACHE_TTL) {
      totalCount = this.cachedTotal.count;
    } else {
      totalCount = await prisma.barber.count();
      this.cachedTotal = { count: totalCount, timestamp: now };
    }

    const barbers = await prisma.barber.findMany({
      orderBy: [
        { wallScore: 'desc' },
        { rating: 'desc' },
      ],
      take: limit,
      skip: offset,
    });

    // Batch fetch all users by emails (1 query instead of N)
    const emails = barbers.map(b => b.email);
    const users = await prisma.user.findMany({
      where: { email: { in: emails } },
      select: { email: true, avatar: true, avatarSeed: true, phone: true },
    });

    // Create lookup map for O(1) access
    const userMap = new Map(users.map(u => [u.email, u]));

    // Get Top positions for all barbers in batch
    const barberIds = barbers.map(b => b.id);
    const topPositionsMap = await this._getTopPositionsForBarbers(barberIds);

    const enrichedBarbers = barbers.map((barber: any) => {
      const user = userMap.get(barber.email);
      const topPositions = topPositionsMap.get(barber.id) ?? { top1: 0, top2: 0, top3: 0, isLastWinner: false };
      return {
        ...barber,
        avatar: user?.avatar || barber.image,
        avatarSeed: user?.avatarSeed ?? `${barber.name}-${barber.id.slice(-6)}`,
        phone: user?.phone,
        isLastWinner: topPositions.isLastWinner,
        top1Count: topPositions.top1,
        top2Count: topPositions.top2,
        top3Count: topPositions.top3,
      };
    });

    // Get last winner ID if needed
    const lastWinner = await competitionService.getLastWinner();
    const lastWinnerBarberId = lastWinner?.barberId ?? null;

    return { barbers: enrichedBarbers, total: totalCount, lastWinnerBarberId };
  }

  async getBarberById(id: string) {
    const barber = await prisma.barber.findUnique({
      where: { id },
      include: {
        workplaceRef: true,
        courses: {
          include: {
            media: {
              orderBy: {
                createdAt: 'asc',
              },
            },
          },
          orderBy: {
            completedAt: 'desc',
          },
        },
      },
    });

    if (!barber) return null;

    // Enrich with user avatar data
    const user = await prisma.user.findUnique({
      where: { email: barber.email },
      select: { avatar: true, avatarSeed: true, phone: true },
    });

    // Get Top positions for this barber
    const topPositionsMap = await this._getTopPositionsForBarbers([id]);
    const topPositions = topPositionsMap.get(id) ?? { top1: 0, top2: 0, top3: 0, isLastWinner: false };

    return {
      ...barber,
      avatar: user?.avatar || barber.image,
      avatarSeed: user?.avatarSeed ?? `${barber.email}-${barber.id}`,
      phone: user?.phone,
      isLastWinner: topPositions.isLastWinner,
      top1Count: topPositions.top1,
      top2Count: topPositions.top2,
      top3Count: topPositions.top3,
    };
  }

  async getBarberByEmail(email: string) {
    const barber = await prisma.barber.findUnique({
      where: { email },
      include: {
        specialtyRef: true,
        workplaceRef: true,
      },
    });
    return barber;
  }

  async updateBarberInfo(email: string, data: {
    specialty?: string;
    specialtyId?: string;
    experienceYears?: number;
    location?: string;
    latitude?: number;
    longitude?: number;
    instagramUrl?: string | null;
    tiktokUrl?: string | null;
  }) {
    const updateData: {
      specialty?: string;
      specialtyId?: string;
      experienceYears?: number;
      location?: string;
      latitude?: number;
      longitude?: number;
      instagramUrl?: string | null;
      tiktokUrl?: string | null;
    } = {};

    if (data.specialty !== undefined) updateData.specialty = data.specialty;
    if (data.specialtyId !== undefined) updateData.specialtyId = data.specialtyId;
    if (data.experienceYears !== undefined) updateData.experienceYears = data.experienceYears;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.latitude !== undefined) updateData.latitude = data.latitude;
    if (data.longitude !== undefined) updateData.longitude = data.longitude;

    // Validar y normalizar redes sociales
    if (data.instagramUrl !== undefined) {
      const instagramValidation = validateAndNormalizeInstagram(data.instagramUrl);
      if (!instagramValidation.isValid) {
        throw new Error(instagramValidation.error || 'Invalid Instagram URL');
      }
      updateData.instagramUrl = instagramValidation.normalizedUrl;
    }

    if (data.tiktokUrl !== undefined) {
      const tiktokValidation = validateAndNormalizeTikTok(data.tiktokUrl);
      if (!tiktokValidation.isValid) {
        throw new Error(tiktokValidation.error || 'Invalid TikTok URL');
      }
      updateData.tiktokUrl = tiktokValidation.normalizedUrl;
    }

    const barber = await prisma.barber.update({
      where: { email },
      data: updateData,
      include: {
        specialtyRef: true,
        workplaceRef: true,
      },
    });
    await this.recomputeWallScore(barber.id);
    return barber;
  }

  async searchBarbers(query: string) {
    const allBarbers = await prisma.barber.findMany({
      orderBy: {
        rating: 'desc',
      },
    });

    const lowerQuery = query.toLowerCase();
    const filteredBarbers = allBarbers.filter((barber: any) => {
      return (
        barber.name.toLowerCase().includes(lowerQuery) ||
        barber.specialty.toLowerCase().includes(lowerQuery) ||
        barber.location.toLowerCase().includes(lowerQuery)
      );
    });

    // Enrich with user avatar data
    const enrichedBarbers = await Promise.all(
      filteredBarbers.map(async (barber: any) => {
        const user = await prisma.user.findUnique({
          where: { email: barber.email },
          select: { avatar: true, avatarSeed: true, phone: true },
        });

        return {
          ...barber,
          avatar: user?.avatar || barber.image,
          avatarSeed: user?.avatarSeed ?? `${barber.email}-${barber.id}`,
        };
      })
    );

    return enrichedBarbers;
  }

  async getBarbersByWorkplaceId(workplaceId: string) {
    const barbers = await prisma.barber.findMany({
      where: {
        workplaceId: workplaceId,
      },
      orderBy: {
        rating: 'desc',
      },
    });

    // Get Top positions for barbers
    const barberIds = barbers.map(b => b.id);
    const topPositionsMap = await this._getTopPositionsForBarbers(barberIds);

    // Enrich with user avatar data and top positions
    const enrichedBarbers = await Promise.all(
      barbers.map(async (barber: any) => {
        const user = await prisma.user.findUnique({
          where: { email: barber.email },
          select: { avatar: true, avatarSeed: true, phone: true },
        });

        const topPositions = topPositionsMap.get(barber.id) ?? { top1: 0, top2: 0, top3: 0, isLastWinner: false };

        return {
          ...barber,
          avatar: user?.avatar || barber.image,
          avatarSeed: user?.avatarSeed ?? `${barber.email}-${barber.id}`,
          phone: user?.phone,
          isLastWinner: topPositions.isLastWinner,
          top1Count: topPositions.top1,
          top2Count: topPositions.top2,
          top3Count: topPositions.top3,
        };
      })
    );

    return enrichedBarbers;
  }

  async toggleFavorite(userId: string, barberId: string) {
    const existing = await prisma.favoriteBarber.findUnique({
      where: {
        userId_barberId: {
          userId,
          barberId,
        },
      },
    });

    if (existing) {
      await prisma.favoriteBarber.delete({
        where: {
          userId_barberId: {
            userId,
            barberId,
          },
        },
      });
      return { isFavorite: false };
    } else {
      await prisma.favoriteBarber.create({
        data: {
          userId,
          barberId,
        },
      });
      return { isFavorite: true };
    }
  }

  async getFavorites(userId: string) {
    const favorites = await prisma.favoriteBarber.findMany({
      where: { userId },
      include: {
        barber: {
          include: {
            workplaceRef: true,
            specialtyRef: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Enrich with user avatar data for each barber
    const enrichedFavorites = await Promise.all(
      favorites.map(async (fav: any) => {
        const barber = fav.barber;
        const user = await prisma.user.findUnique({
          where: { email: barber.email },
          select: { avatar: true, avatarSeed: true, phone: true },
        });

        return {
          ...barber,
          avatar: user?.avatar || barber.image,
          avatarSeed: user?.avatarSeed ?? `${barber.email}-${barber.id}`,
          favoritedAt: fav.createdAt,
          phone: user?.phone,
        };
      })
    );

    return enrichedFavorites;
  }

  async getBarberBySlug(slug: string) {
    const barber = await prisma.barber.findUnique({
      where: { slug: slug },
      include: {
        workplaceRef: true,
        services: true,
        specialtyRef: true,
        portfolio: true,
        courses: {
          include: {
            media: true
          },
          orderBy: {
            completedAt: 'desc'
          }
        }
      },
    });

    if (!barber) return null;

    // Enrich with user avatar data
    const user = await prisma.user.findUnique({
      where: { email: barber.email },
      select: { avatar: true, avatarSeed: true, phone: true },
    });

    return {
      ...barber,
      avatar: user?.avatar || barber.image,
      avatarSeed: user?.avatarSeed ?? `${barber.email}-${barber.id}`,
    };
  }

  /**
   * Helper method to get Top positions (1, 2, 3) for multiple barbers in batch
   * @param barberIds Array of barber IDs
   * @returns Map with barberId as key and { top1, top2, top3, isLastWinner } as value
   */
  private async _getTopPositionsForBarbers(
    barberIds: string[]
  ): Promise<Map<string, { top1: number; top2: number; top3: number; isLastWinner: boolean }>> {
    const topPositionsMap = new Map<string, { top1: number; top2: number; top3: number; isLastWinner: boolean }>();
    
    if (barberIds.length === 0) return topPositionsMap;

    // Get all closed periods with snapshots
    const allClosedPeriods = await prisma.competitionPeriod.findMany({
      where: {
        status: 'CLOSED',
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

    // Only use the most recent closed period (first one after ordering by endDate desc)
    if (closedPeriods.length > 0) {
      const mostRecentPeriod = closedPeriods[0];
      const snapshot = mostRecentPeriod.finalStandingsSnapshot as any[] | null;
      
      if (Array.isArray(snapshot) && snapshot.length > 0) {
        for (const entry of snapshot) {
          if (!entry?.barberId || !barberIds.includes(entry.barberId)) continue;
          if (entry.position < 1 || entry.position > 3) continue;

          const isLastWinner = entry.position === 1 && mostRecentPeriod.winnerBarberId === entry.barberId;
          
          if (entry.position === 1) {
            topPositionsMap.set(entry.barberId, { top1: 1, top2: 0, top3: 0, isLastWinner });
          } else if (entry.position === 2) {
            topPositionsMap.set(entry.barberId, { top1: 0, top2: 1, top3: 0, isLastWinner: false });
          } else if (entry.position === 3) {
            topPositionsMap.set(entry.barberId, { top1: 0, top2: 0, top3: 1, isLastWinner: false });
          }
        }
      }
    }

    return topPositionsMap;
  }
}

export default new BarberService();
