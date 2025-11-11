import prisma from '../config/prisma';

export class PromotionService {
  async getActivePromotions() {
    const now = new Date();
    
    const promotions = await prisma.promotion.findMany({
      where: {
        isActive: true,
        validFrom: {
          lte: now,
        },
        validUntil: {
          gte: now,
        },
      },
      include: {
        barber: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return promotions.map((promotion: any) => {
      return {
        id: promotion.id,
        title: promotion.title,
        description: promotion.description,
        code: promotion.code,
        discount: promotion.discount,
        discountAmount: promotion.discountAmount,
        validFrom: promotion.validFrom,
        validUntil: promotion.validUntil,
        isActive: promotion.isActive,
        image: promotion.image,
        barber: promotion.barber ? {
          id: promotion.barber.id,
          name: promotion.barber.name,
          email: promotion.barber.email,
        } : null,
        createdAt: promotion.createdAt,
        updatedAt: promotion.updatedAt,
      };
    });
  }

  async getActivePromotionsByBarber(barberId: string) {
    const now = new Date();
    
    const promotions = await prisma.promotion.findMany({
      where: {
        isActive: true,
        barberId: barberId,
        validFrom: {
          lte: now,
        },
        validUntil: {
          gte: now,
        },
      },
      include: {
        barber: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return promotions.map((promotion: any) => {
      return {
        id: promotion.id,
        title: promotion.title,
        description: promotion.description,
        code: promotion.code,
        discount: promotion.discount,
        discountAmount: promotion.discountAmount,
        validFrom: promotion.validFrom,
        validUntil: promotion.validUntil,
        isActive: promotion.isActive,
        image: promotion.image,
        barber: promotion.barber ? {
          id: promotion.barber.id,
          name: promotion.barber.name,
          email: promotion.barber.email,
        } : null,
        createdAt: promotion.createdAt,
        updatedAt: promotion.updatedAt,
      };
    });
  }

  async getPromotionById(id: string) {
    const promotion = await prisma.promotion.findUnique({
      where: { id },
      include: {
        barber: true,
      },
    });

    if (!promotion) return null;

    return {
      id: promotion.id,
      title: promotion.title,
      description: promotion.description,
      code: promotion.code,
      discount: promotion.discount,
      discountAmount: promotion.discountAmount,
      validFrom: promotion.validFrom,
      validUntil: promotion.validUntil,
      isActive: promotion.isActive,
      image: promotion.image,
      barberId: promotion.barberId,
      barber: promotion.barber ? {
        id: promotion.barber.id,
        name: promotion.barber.name,
        email: promotion.barber.email,
      } : null,
      createdAt: promotion.createdAt,
      updatedAt: promotion.updatedAt,
    };
  }

  /**
   * Obtiene todas las promociones con paginación (para admin)
   */
  async getAllPromotions(page: number = 1, limit: number = 10, search?: string, isActive?: boolean) {
    const skip = (page - 1) * limit;
    
    const where: any = {};
    
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { code: { contains: search } },
      ];
    }
    
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [promotions, total] = await Promise.all([
      prisma.promotion.findMany({
        where,
        include: {
          barber: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.promotion.count({ where }),
    ]);

    return {
      promotions: promotions.map((promotion: any) => ({
        id: promotion.id,
        title: promotion.title,
        description: promotion.description,
        code: promotion.code,
        discount: promotion.discount,
        discountAmount: promotion.discountAmount,
        validFrom: promotion.validFrom,
        validUntil: promotion.validUntil,
        isActive: promotion.isActive,
        image: promotion.image,
        barberId: promotion.barberId,
        barber: promotion.barber ? {
          id: promotion.barber.id,
          name: promotion.barber.name,
          email: promotion.barber.email,
        } : null,
        createdAt: promotion.createdAt,
        updatedAt: promotion.updatedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Crea una nueva promoción (para admin)
   */
  async createPromotion(data: {
    title: string;
    description: string;
    code: string;
    discount?: number;
    discountAmount?: number;
    validFrom: Date;
    validUntil: Date;
    isActive?: boolean;
    image?: string;
    barberId?: string;
  }) {
    // Verificar que el código sea único
    const existingPromotion = await prisma.promotion.findUnique({
      where: { code: data.code },
    });

    if (existingPromotion) {
      throw new Error('El código de promoción ya existe');
    }

    const promotion = await prisma.promotion.create({
      data: {
        title: data.title,
        description: data.description,
        code: data.code,
        discount: data.discount || null,
        discountAmount: data.discountAmount || null,
        validFrom: data.validFrom,
        validUntil: data.validUntil,
        isActive: data.isActive ?? true,
        image: data.image || null,
        barberId: data.barberId || null,
      },
      include: {
        barber: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return {
      id: promotion.id,
      title: promotion.title,
      description: promotion.description,
      code: promotion.code,
      discount: promotion.discount,
      discountAmount: promotion.discountAmount,
      validFrom: promotion.validFrom,
      validUntil: promotion.validUntil,
      isActive: promotion.isActive,
      image: promotion.image,
      barberId: promotion.barberId,
      barber: promotion.barber ? {
        id: promotion.barber.id,
        name: promotion.barber.name,
        email: promotion.barber.email,
      } : null,
      createdAt: promotion.createdAt,
      updatedAt: promotion.updatedAt,
    };
  }

  /**
   * Actualiza una promoción (para admin)
   */
  async updatePromotion(id: string, data: {
    title?: string;
    description?: string;
    code?: string;
    discount?: number;
    discountAmount?: number;
    validFrom?: Date;
    validUntil?: Date;
    isActive?: boolean;
    image?: string;
    barberId?: string;
  }) {
    // Si se está actualizando el código, verificar que sea único
    if (data.code) {
      const existingPromotion = await prisma.promotion.findUnique({
        where: { code: data.code },
      });

      if (existingPromotion && existingPromotion.id !== id) {
        throw new Error('El código de promoción ya existe');
      }
    }

    const promotion = await prisma.promotion.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description && { description: data.description }),
        ...(data.code && { code: data.code }),
        ...(data.discount !== undefined && { discount: data.discount || null }),
        ...(data.discountAmount !== undefined && { discountAmount: data.discountAmount || null }),
        ...(data.validFrom && { validFrom: data.validFrom }),
        ...(data.validUntil && { validUntil: data.validUntil }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.image !== undefined && { image: data.image || null }),
        ...(data.barberId !== undefined && { barberId: data.barberId || null }),
      },
      include: {
        barber: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return {
      id: promotion.id,
      title: promotion.title,
      description: promotion.description,
      code: promotion.code,
      discount: promotion.discount,
      discountAmount: promotion.discountAmount,
      validFrom: promotion.validFrom,
      validUntil: promotion.validUntil,
      isActive: promotion.isActive,
      image: promotion.image,
      barberId: promotion.barberId,
      barber: promotion.barber ? {
        id: promotion.barber.id,
        name: promotion.barber.name,
        email: promotion.barber.email,
      } : null,
      createdAt: promotion.createdAt,
      updatedAt: promotion.updatedAt,
    };
  }

  /**
   * Elimina una promoción (para admin)
   */
  async deletePromotion(id: string) {
    await prisma.promotion.delete({
      where: { id },
    });
  }
}

export default new PromotionService();

