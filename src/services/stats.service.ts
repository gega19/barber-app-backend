import prisma from '../config/prisma';

export interface DashboardStats {
  totalUsers: number;
  totalAppointments: number;
  totalBarbers: number;
  totalRevenue: number;
  pendingAppointments: number;
  averageRating: number;
}

class StatsService {
  async getDashboardStats(): Promise<DashboardStats> {
    // Get total users
    const totalUsers = await prisma.user.count();

    // Get total barbers (users with barber profile)
    const totalBarbers = await prisma.barber.count();

    // Get total appointments
    const totalAppointments = await prisma.appointment.count();

    // Get pending appointments
    const pendingAppointments = await prisma.appointment.count({
      where: {
        status: 'PENDING',
      },
    });

    // Get completed appointments with barber price to calculate revenue
    const completedAppointments = await prisma.appointment.findMany({
      where: {
        status: 'COMPLETED',
      },
      include: {
        barber: {
          select: {
            price: true,
          },
        },
      },
    });

    // Calculate total revenue from completed appointments
    const totalRevenue = completedAppointments.reduce((sum, appointment) => {
      return sum + (appointment.barber?.price || 0);
    }, 0);

    // Get average rating from reviews table
    // First, get all reviews (rating is Int, not nullable)
    const reviews = await prisma.review.findMany({
      select: {
        rating: true,
      },
    });

    // Calculate average rating from reviews
    let averageRating = 0;
    if (reviews.length > 0) {
      const sumRatings = reviews.reduce((sum, review) => sum + review.rating, 0);
      averageRating = sumRatings / reviews.length;
    } else {
      // Fallback: try to get from barber.rating if no reviews
      // Get all barbers with rating > 0
      const barbersWithRating = await prisma.barber.findMany({
        where: {
          rating: {
            gt: 0,
          },
        },
        select: {
          rating: true,
        },
      });

      if (barbersWithRating.length > 0) {
        averageRating = barbersWithRating.reduce((sum, barber) => sum + barber.rating, 0) / barbersWithRating.length;
      }
    }

    return {
      totalUsers,
      totalAppointments,
      totalBarbers,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      pendingAppointments,
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
    };
  }
}

export default new StatsService();

