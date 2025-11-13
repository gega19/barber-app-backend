import prisma from '../config/prisma';

export interface CreateWorkplaceDto {
  name: string;
  address?: string;
  city?: string;
  description?: string;
  image?: string;
  banner?: string;
}

export interface UpdateWorkplaceDto {
  name?: string;
  address?: string;
  city?: string;
  description?: string;
  image?: string;
  banner?: string;
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

    const workplace = await prisma.workplace.create({
      data: {
        name: data.name,
        address: data.address,
        city: data.city,
        description: data.description,
        image: data.image,
        banner: data.banner,
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

    const workplace = await prisma.workplace.update({
      where: { id },
      data: {
        name: data.name,
        address: data.address,
        city: data.city,
        description: data.description,
        image: data.image,
        banner: data.banner,
      },
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
