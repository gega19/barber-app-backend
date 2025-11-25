import prisma from '../config/prisma';
import { validateAndNormalizeInstagram, validateAndNormalizeTikTok } from '../utils/social-media.validator';

export interface CreateWorkplaceDto {
  name: string;
  address?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  image?: string;
  banner?: string;
  instagramUrl?: string | null;
  tiktokUrl?: string | null;
}

export interface UpdateWorkplaceDto {
  name?: string;
  address?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  image?: string;
  banner?: string;
  instagramUrl?: string | null;
  tiktokUrl?: string | null;
}

export class WorkplaceService {
  async getAllWorkplaces(page: number = 1, limit: number = 10, search?: string) {
    const skip = (page - 1) * limit;
    
    const where = search
      ? {
          OR: [
            { name: { contains: search } },
            { address: { contains: search } },
            { city: { contains: search } },
          ],
        }
      : {};

    const [workplaces, total] = await Promise.all([
      prisma.workplace.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          _count: {
            select: {
              barbers: true,
              reviewList: true,
            },
          },
        },
      }),
      prisma.workplace.count({ where }),
    ]);

    return {
      workplaces: workplaces.map(workplace => ({
        ...workplace,
        barbersCount: workplace._count.barbers,
        reviewsCount: workplace._count.reviewList,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getWorkplaces() {
    const workplaces = await prisma.workplace.findMany({
      orderBy: {
        name: 'asc',
      },
    });
    return workplaces;
  }

  async getTrendingWorkplaces(limit: number = 3) {
    const workplaces = await prisma.workplace.findMany({
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });
    return workplaces;
  }

  async getBestWorkplaces(limit: number = 5) {
    const workplaces = await prisma.workplace.findMany({
      take: limit,
      orderBy: {
        rating: 'desc',
      },
      include: {
        _count: {
          select: {
            barbers: true,
            reviewList: true,
          },
        },
      },
    });
    
    return workplaces.map(workplace => ({
      ...workplace,
      barbersCount: workplace._count.barbers,
      reviewsCount: workplace._count.reviewList,
    }));
  }

  /**
   * Get workplaces near a specific location
   * @param latitude - Latitude of the center point
   * @param longitude - Longitude of the center point
   * @param radiusKm - Radius in kilometers (default: 5)
   * @returns Array of workplaces with distance calculated
   */
  async getNearbyWorkplaces(latitude: number, longitude: number, radiusKm: number = 5) {
    // Earth's radius in kilometers
    const earthRadiusKm = 6371;

    // Get all workplaces with coordinates
    const workplaces = await prisma.workplace.findMany({
      where: {
        latitude: { not: null },
        longitude: { not: null },
      },
      include: {
        _count: {
          select: {
            barbers: true,
            reviewList: true,
          },
        },
      },
    });

    // Calculate distance for each workplace and filter by radius
    const workplacesWithDistance = workplaces
      .map((workplace) => {
        if (!workplace.latitude || !workplace.longitude) {
          return null;
        }

        // Haversine formula to calculate distance
        const dLat = this.degreesToRadians(workplace.latitude - latitude);
        const dLon = this.degreesToRadians(workplace.longitude - longitude);

        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(this.degreesToRadians(latitude)) *
            Math.cos(this.degreesToRadians(workplace.latitude)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = earthRadiusKm * c;

        return {
          ...workplace,
          distance: Math.round(distance * 100) / 100, // Round to 2 decimal places
        };
      })
      .filter((wp) => wp !== null && wp.distance <= radiusKm) as Array<
      typeof workplaces[0] & { distance: number }
    >;

    // Sort by distance (closest first)
    workplacesWithDistance.sort((a, b) => a.distance - b.distance);

    return workplacesWithDistance.map((workplace) => ({
      ...workplace,
      barbersCount: workplace._count.barbers,
      reviewsCount: workplace._count.reviewList,
    }));
  }

  /**
   * Convert degrees to radians
   */
  private degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  async getWorkplaceById(id: string) {
    const workplace = await prisma.workplace.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            barbers: true,
            reviewList: true,
          },
        },
      },
    });
    
    if (!workplace) {
      throw new Error('Workplace not found');
    }

    return {
      ...workplace,
      barbersCount: workplace._count.barbers,
      reviewsCount: workplace._count.reviewList,
    };
  }

  async createWorkplace(data: CreateWorkplaceDto) {
    // Check if workplace with same name already exists
    const existing = await prisma.workplace.findUnique({
      where: { name: data.name },
    });

    if (existing) {
      throw new Error('Workplace with this name already exists');
    }

    // Validate coordinates: if one is provided, both must be provided
    if ((data.latitude !== undefined && data.longitude === undefined) ||
        (data.latitude === undefined && data.longitude !== undefined)) {
      throw new Error('Both latitude and longitude must be provided together');
    }

    // Validate coordinate ranges
    if (data.latitude !== undefined) {
      if (data.latitude < -90 || data.latitude > 90) {
        throw new Error('Latitude must be between -90 and 90');
      }
    }
    if (data.longitude !== undefined) {
      if (data.longitude < -180 || data.longitude > 180) {
        throw new Error('Longitude must be between -180 and 180');
      }
    }

    // Validar y normalizar redes sociales
    let instagramUrl: string | null = null;
    let tiktokUrl: string | null = null;

    if (data.instagramUrl !== undefined && data.instagramUrl !== null) {
      const instagramValidation = validateAndNormalizeInstagram(data.instagramUrl);
      if (!instagramValidation.isValid) {
        throw new Error(instagramValidation.error || 'Invalid Instagram URL');
      }
      instagramUrl = instagramValidation.normalizedUrl;
    }

    if (data.tiktokUrl !== undefined && data.tiktokUrl !== null) {
      const tiktokValidation = validateAndNormalizeTikTok(data.tiktokUrl);
      if (!tiktokValidation.isValid) {
        throw new Error(tiktokValidation.error || 'Invalid TikTok URL');
      }
      tiktokUrl = tiktokValidation.normalizedUrl;
    }

    const workplace = await prisma.workplace.create({
      data: {
        name: data.name,
        address: data.address,
        city: data.city,
        latitude: data.latitude,
        longitude: data.longitude,
        description: data.description,
        image: data.image,
        banner: data.banner,
        instagramUrl,
        tiktokUrl,
      },
    });

    return workplace;
  }

  async updateWorkplace(id: string, data: UpdateWorkplaceDto) {
    // Check if workplace exists
    const existing = await prisma.workplace.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error('Workplace not found');
    }

    // Check if name is being changed and if new name already exists
    if (data.name && data.name !== existing.name) {
      const nameExists = await prisma.workplace.findUnique({
        where: { name: data.name },
      });

      if (nameExists) {
        throw new Error('Workplace with this name already exists');
      }
    }

    // Validate coordinates: if one is provided, both must be provided
    if ((data.latitude !== undefined && data.longitude === undefined) ||
        (data.latitude === undefined && data.longitude !== undefined)) {
      throw new Error('Both latitude and longitude must be provided together');
    }

    // Validate coordinate ranges
    if (data.latitude !== undefined) {
      if (data.latitude < -90 || data.latitude > 90) {
        throw new Error('Latitude must be between -90 and 90');
      }
    }
    if (data.longitude !== undefined) {
      if (data.longitude < -180 || data.longitude > 180) {
        throw new Error('Longitude must be between -180 and 180');
      }
    }

    // Validar y normalizar redes sociales
    const updateData: any = {
      name: data.name,
      address: data.address,
      city: data.city,
      latitude: data.latitude,
      longitude: data.longitude,
      description: data.description,
      image: data.image,
      banner: data.banner,
    };

    if (data.instagramUrl !== undefined) {
      if (data.instagramUrl === null || data.instagramUrl.trim() === '') {
        updateData.instagramUrl = null;
      } else {
        const instagramValidation = validateAndNormalizeInstagram(data.instagramUrl);
        if (!instagramValidation.isValid) {
          throw new Error(instagramValidation.error || 'Invalid Instagram URL');
        }
        updateData.instagramUrl = instagramValidation.normalizedUrl;
      }
    }

    if (data.tiktokUrl !== undefined) {
      if (data.tiktokUrl === null || data.tiktokUrl.trim() === '') {
        updateData.tiktokUrl = null;
      } else {
        const tiktokValidation = validateAndNormalizeTikTok(data.tiktokUrl);
        if (!tiktokValidation.isValid) {
          throw new Error(tiktokValidation.error || 'Invalid TikTok URL');
        }
        updateData.tiktokUrl = tiktokValidation.normalizedUrl;
      }
    }

    const workplace = await prisma.workplace.update({
      where: { id },
      data: updateData,
    });

    return workplace;
  }

  async deleteWorkplace(id: string) {
    // Check if workplace exists
    const workplace = await prisma.workplace.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            barbers: true,
            reviewList: true,
          },
        },
      },
    });

    if (!workplace) {
      throw new Error('Workplace not found');
    }

    // Check if workplace has barbers
    if (workplace._count.barbers > 0) {
      throw new Error('No se puede eliminar la barbería porque tiene barberos activos trabajando ahí. Por favor, elimina o reasigna los barberos primero.');
    }

    // Delete workplace and related data in a transaction
    await prisma.$transaction(async (tx: any) => {
      // Delete reviews
      await tx.review.deleteMany({
        where: { workplaceId: id },
      });

      // Delete workplace
      await tx.workplace.delete({
        where: { id },
      });
    });

    return { message: 'Workplace deleted successfully' };
  }
}

export default new WorkplaceService();
