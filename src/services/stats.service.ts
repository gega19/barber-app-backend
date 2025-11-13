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

  /**
   * Obtiene estadísticas de citas por mes (últimos 6 meses)
   */
  async getAppointmentsByMonth(): Promise<Array<{ month: string; count: number }>> {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setDate(1); // Primer día del mes
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const appointments = await prisma.appointment.findMany({
      where: {
        date: {
          gte: sixMonthsAgo,
        },
      },
      select: {
        date: true,
      },
    });

    // Agrupar por mes
    const monthMap = new Map<string, number>();
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    appointments.forEach((appointment) => {
      const date = new Date(appointment.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + 1);
    });

    // Generar los últimos 6 meses
    const result: Array<{ month: string; count: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = monthNames[date.getMonth()];
      result.push({
        month: `${monthName} ${date.getFullYear()}`,
        count: monthMap.get(monthKey) || 0,
      });
    }

    return result;
  }

  /**
   * Obtiene ingresos por mes (últimos 6 meses)
   */
  async getRevenueByMonth(): Promise<Array<{ month: string; revenue: number }>> {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const completedAppointments = await prisma.appointment.findMany({
      where: {
        status: 'COMPLETED',
        date: {
          gte: sixMonthsAgo,
        },
      },
      include: {
        barber: {
          select: {
            price: true,
          },
        },
      },
    });

    // Agrupar por mes
    const monthMap = new Map<string, number>();
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    completedAppointments.forEach((appointment) => {
      const date = new Date(appointment.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const revenue = appointment.barber?.price || 0;
      monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + revenue);
    });

    // Generar los últimos 6 meses
    const result: Array<{ month: string; revenue: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = monthNames[date.getMonth()];
      result.push({
        month: `${monthName} ${date.getFullYear()}`,
        revenue: Math.round((monthMap.get(monthKey) || 0) * 100) / 100,
      });
    }

    return result;
  }

  /**
   * Obtiene distribución de citas por estado
   */
  async getAppointmentsByStatus(): Promise<Array<{ status: string; count: number }>> {
    const statuses = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];
    const result = await Promise.all(
      statuses.map(async (status) => {
        const count = await prisma.appointment.count({
          where: { status },
        });
        return { status, count };
      })
    );

    return result;
  }
}

export default new StatsService();

