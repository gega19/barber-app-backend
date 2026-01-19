import prisma from '../config/prisma';

class MyWorkplaceService {
    async getWorkplaceDetails(workplaceId: string) {
        return prisma.workplace.findUnique({
            where: { id: workplaceId },
            include: {
                media: true,
            },
        });
    }

    async getWorkplaceBarbers(workplaceId: string) {
        return prisma.barber.findMany({
            where: { workplaceId },
            include: {
                specialtyRef: true,
            },
        });
    }

    async getWorkplaceClients(workplaceId: string) {
        // Get unique clients from appointments in this workplace
        const appointments = await prisma.appointment.findMany({
            where: {
                barber: {
                    workplaceId: workplaceId,
                },
            },
            select: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        avatar: true,
                    },
                },
            },
            distinct: ['userId'],
        });

        return appointments.map((a: any) => a.user);
    }

    async getWorkplaceAppointments(workplaceId: string) {
        return prisma.appointment.findMany({
            where: {
                barber: {
                    workplaceId: workplaceId,
                },
            },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
                barber: {
                    select: {
                        name: true,
                    },
                },
                service: true,
            },
            orderBy: {
                date: 'desc',
            },
        });
    }

    async getWorkplaceStats(workplaceId: string) {
        const appointments = await prisma.appointment.findMany({
            where: {
                barber: {
                    workplaceId: workplaceId,
                },
            },
            select: {
                status: true,
                service: {
                    select: {
                        price: true
                    }
                }
            },
        });

        const totalAppointments = appointments.length;
        const completedAppointments = appointments.filter((a: any) => a.status === 'COMPLETED');
        const totalRevenue = completedAppointments.reduce((sum: number, a: any) => sum + (a.service?.price || 0), 0);

        return {
            totalAppointments,
            completedAppointments: completedAppointments.length,
            totalRevenue: Math.round(totalRevenue * 100) / 100,
        };
    }
}

export default new MyWorkplaceService();
