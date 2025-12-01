import prisma from '../config/prisma';

export class ReviewService {
  async getReviewsByBarberId(barberId: string) {
    const reviews = await prisma.review.findMany({
      where: { barberId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            avatarSeed: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return reviews.map((review: any) => ({
      id: review.id,
      userId: review.userId,
      barberId: review.barberId,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      user: {
        id: review.user.id,
        name: review.user.name,
        email: review.user.email,
        avatar: review.user.avatar,
        avatarSeed: review.user.avatarSeed,
      },
    }));
  }

  async getReviewsByWorkplaceId(workplaceId: string) {
    const reviews = await prisma.review.findMany({
      where: { workplaceId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            avatarSeed: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return reviews.map((review: any) => ({
      id: review.id,
      userId: review.userId,
      workplaceId: review.workplaceId,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      user: {
        id: review.user.id,
        name: review.user.name,
        email: review.user.email,
        avatar: review.user.avatar,
        avatarSeed: review.user.avatarSeed,
      },
    }));
  }

  async hasUserReviewedBarber(userId: string, barberId: string): Promise<boolean> {
    const review = await prisma.review.findFirst({
      where: {
        userId,
        barberId,
      },
    });
    return !!review;
  }

  async hasUserReviewedWorkplace(userId: string, workplaceId: string): Promise<boolean> {
    const review = await prisma.review.findFirst({
      where: {
        userId,
        workplaceId,
      },
    });
    return !!review;
  }

  async createReview(data: {
    userId: string;
    barberId?: string;
    workplaceId?: string;
    rating: number;
    comment?: string;
  }) {
    // Validar que no se reseñe a sí mismo
    if (data.barberId) {
      const barber = await prisma.barber.findUnique({
        where: { id: data.barberId },
        select: { email: true },
      });

      if (barber) {
        const user = await prisma.user.findUnique({
          where: { id: data.userId },
          select: { email: true },
        });

        if (user && user.email === barber.email) {
          throw new Error('No puedes dejar una reseña a tu propio perfil');
        }
      }

      // Validar que no haya ya una reseña de este usuario a este barbero
      const existingReview = await prisma.review.findFirst({
        where: {
          userId: data.userId,
          barberId: data.barberId,
        },
      });

      if (existingReview) {
        throw new Error('Ya has dejado una reseña a este barbero');
      }
    }

    if (data.workplaceId) {
      // Validar que no haya ya una reseña de este usuario a esta barbería
      const existingReview = await prisma.review.findFirst({
        where: {
          userId: data.userId,
          workplaceId: data.workplaceId,
        },
      });

      if (existingReview) {
        throw new Error('Ya has dejado una reseña a esta barbería');
      }
    }

    const review = await prisma.review.create({
      data: {
        userId: data.userId,
        barberId: data.barberId,
        workplaceId: data.workplaceId,
        rating: data.rating,
        comment: data.comment,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            avatarSeed: true,
          },
        },
      },
    });

    // Update rating and review count
    if (data.barberId) {
      await this.updateBarberRating(data.barberId);
    } else if (data.workplaceId) {
      await this.updateWorkplaceRating(data.workplaceId);
    }

    return {
      id: review.id,
      userId: review.userId,
      barberId: review.barberId,
      workplaceId: review.workplaceId,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      user: {
        id: review.user.id,
        name: review.user.name,
        email: review.user.email,
        avatar: review.user.avatar,
        avatarSeed: review.user.avatarSeed,
      },
    };
  }

  /**
   * Obtiene el rating promedio global de todos los barberos
   * Esto se usa para el cálculo de Bayesian Average
   */
  private async getGlobalAverageBarberRating(): Promise<number> {
    const allReviews = await prisma.review.findMany({
      where: { barberId: { not: null } },
      select: { rating: true },
    });

    if (allReviews.length === 0) {
      return 3.0; // Rating por defecto si no hay reviews
    }

    const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
    return totalRating / allReviews.length;
  }

  /**
   * Obtiene el rating promedio global de todas las barberías
   * Esto se usa para el cálculo de Bayesian Average
   */
  private async getGlobalAverageWorkplaceRating(): Promise<number> {
    const allReviews = await prisma.review.findMany({
      where: { workplaceId: { not: null } },
      select: { rating: true },
    });

    if (allReviews.length === 0) {
      return 3.0; // Rating por defecto si no hay reviews
    }

    const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
    return totalRating / allReviews.length;
  }

  /**
   * Actualiza el rating de un barbero usando Bayesian Average
   * Fórmula: (totalRating + C * m) / (reviews.length + C)
   * donde C = peso mínimo, m = rating promedio global
   * 
   * Esto evita que barberos con pocas reviews tengan ratings artificialmente altos
   */
  private async updateBarberRating(barberId: string) {
    const reviews = await prisma.review.findMany({
      where: { barberId },
      select: { rating: true },
    });

    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
      
      // Obtener rating promedio global de todos los barberos
      const globalAvg = await this.getGlobalAverageBarberRating();
      
      // Parámetros para Bayesian Average
      const C = 5; // Peso mínimo (número mágico - ajustable según necesidades)
      const m = globalAvg; // Rating promedio global
      
      // Calcular Bayesian Average
      // Fórmula: (totalRating + C * m) / (reviews.length + C)
      const bayesianRating = (totalRating + C * m) / (reviews.length + C);
      
      // Redondear a 1 decimal para consistencia
      const roundedRating = Math.round(bayesianRating * 10) / 10;

      await prisma.barber.update({
        where: { id: barberId },
        data: {
          rating: roundedRating,
          reviews: reviews.length,
        },
      });
    }
  }

  /**
   * Actualiza el rating de una barbería usando Bayesian Average
   * Misma lógica que updateBarberRating pero para workplaces
   */
  private async updateWorkplaceRating(workplaceId: string) {
    const reviews = await prisma.review.findMany({
      where: { workplaceId },
      select: { rating: true },
    });

    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
      
      // Obtener rating promedio global de todas las barberías
      const globalAvg = await this.getGlobalAverageWorkplaceRating();
      
      // Parámetros para Bayesian Average
      const C = 5; // Peso mínimo (número mágico - ajustable según necesidades)
      const m = globalAvg; // Rating promedio global
      
      // Calcular Bayesian Average
      // Fórmula: (totalRating + C * m) / (reviews.length + C)
      const bayesianRating = (totalRating + C * m) / (reviews.length + C);
      
      // Redondear a 1 decimal para consistencia
      const roundedRating = Math.round(bayesianRating * 10) / 10;

      await prisma.workplace.update({
        where: { id: workplaceId },
        data: {
          rating: roundedRating,
          reviews: reviews.length,
        },
      });
    }
  }
}

export default new ReviewService();

