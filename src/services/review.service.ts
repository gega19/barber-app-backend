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

  private async updateBarberRating(barberId: string) {
    const reviews = await prisma.review.findMany({
      where: { barberId },
      select: { rating: true },
    });

    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
      const avgRating = totalRating / reviews.length;

      await prisma.barber.update({
        where: { id: barberId },
        data: {
          rating: avgRating,
          reviews: reviews.length,
        },
      });
    }
  }

  private async updateWorkplaceRating(workplaceId: string) {
    const reviews = await prisma.review.findMany({
      where: { workplaceId },
      select: { rating: true },
    });

    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
      const avgRating = totalRating / reviews.length;

      await prisma.workplace.update({
        where: { id: workplaceId },
        data: {
          rating: avgRating,
          reviews: reviews.length,
        },
      });
    }
  }
}

export default new ReviewService();

