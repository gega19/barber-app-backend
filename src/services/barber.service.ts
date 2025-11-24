import prisma from '../config/prisma';
import { validateAndNormalizeInstagram, validateAndNormalizeTikTok } from '../utils/social-media.validator';

export class BarberService {
  async getBarbers() {
    const barbers = await prisma.barber.findMany({
      orderBy: {
        rating: 'desc',
      },
    });

    // Enrich with user avatar data
    const enrichedBarbers = await Promise.all(
      barbers.map(async (barber: any) => {
        const user = await prisma.user.findUnique({
          where: { email: barber.email },
          select: { avatar: true, avatarSeed: true },
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

  async getBestBarbers(limit: number = 10) {
    const barbers = await prisma.barber.findMany({
      orderBy: {
        rating: 'desc',
      },
      take: limit,
    });

    // Enrich with user avatar data
    const enrichedBarbers = await Promise.all(
      barbers.map(async (barber: any) => {
        const user = await prisma.user.findUnique({
          where: { email: barber.email },
          select: { avatar: true, avatarSeed: true },
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
      select: { avatar: true, avatarSeed: true },
    });

    return {
      ...barber,
      avatar: user?.avatar || barber.image,
      avatarSeed: user?.avatarSeed ?? `${barber.email}-${barber.id}`,
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
          select: { avatar: true, avatarSeed: true },
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

    // Enrich with user avatar data
    const enrichedBarbers = await Promise.all(
      barbers.map(async (barber: any) => {
        const user = await prisma.user.findUnique({
          where: { email: barber.email },
          select: { avatar: true, avatarSeed: true },
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
}

export default new BarberService();
