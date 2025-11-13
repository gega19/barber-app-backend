import prisma from '../config/prisma';
import barberAvailabilityService from './barber-availability.service';
import { emitToBarberRoom } from '../socket/socket.server';
import { AppointmentCreatedData, AppointmentUpdatedData, AppointmentCancelledData, AppointmentPaymentVerifiedData } from '../socket/socket.types';

export class AppointmentService {
  async getAppointmentsByUserId(userId: string) {
    const appointments = await prisma.appointment.findMany({
      where: { userId },
      include: {
        barber: {
          include: {
            specialtyRef: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    const enrichedAppointments = await Promise.all(
      appointments.map(async (appointment: any) => {
        const barber = appointment.barber;
        const user = await prisma.user.findUnique({
          where: { email: barber.email },
          select: { avatar: true, avatarSeed: true },
        });

        // Get payment method name if paymentMethod ID exists
        let paymentMethodName = null;
        if (appointment.paymentMethod) {
          const paymentMethod = await prisma.paymentMethod.findUnique({
            where: { id: appointment.paymentMethod },
            select: { name: true },
          });
          paymentMethodName = paymentMethod?.name || null;
        }

        return {
          id: appointment.id,
          barberId: appointment.barberId,
          barber: {
            id: barber.id,
            name: barber.name,
            email: barber.email,
            specialty: barber.specialty,
            rating: barber.rating,
            image: user?.avatar || barber.image,
            avatarSeed: user?.avatarSeed || null,
            location: barber.location,
          },
          date: appointment.date,
          time: appointment.time,
          status: appointment.status,
          paymentMethod: appointment.paymentMethod,
          paymentMethodName: paymentMethodName,
          paymentStatus: appointment.paymentStatus,
          paymentProof: appointment.paymentProof,
          notes: appointment.notes,
          createdAt: appointment.createdAt,
          updatedAt: appointment.updatedAt,
        };
      })
    );

    return enrichedAppointments;
  }

  async getAppointmentsByBarberId(barberId: string) {
    const appointments = await prisma.appointment.findMany({
      where: { barberId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
            avatarSeed: true,
          },
        },
        barber: {
          include: {
            specialtyRef: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    const enrichedAppointments = await Promise.all(
      appointments.map(async (appointment: any) => {
        const user = appointment.user;
        const barber = appointment.barber;
        const barberUser = await prisma.user.findUnique({
          where: { email: barber.email },
          select: { avatar: true, avatarSeed: true },
        });

        // Get payment method name if paymentMethod ID exists
        let paymentMethodName = null;
        if (appointment.paymentMethod) {
          const paymentMethod = await prisma.paymentMethod.findUnique({
            where: { id: appointment.paymentMethod },
            select: { name: true },
          });
          paymentMethodName = paymentMethod?.name || null;
        }

        return {
          id: appointment.id,
          userId: appointment.userId,
          barberId: appointment.barberId,
          client: {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            avatar: user.avatar,
            avatarSeed: user.avatarSeed,
          },
          barber: {
            id: barber.id,
            name: barber.name,
            email: barber.email,
            specialty: barber.specialty,
            rating: barber.rating,
            image: barberUser?.avatar || barber.image,
            avatarSeed: barberUser?.avatarSeed || null,
            location: barber.location,
          },
          date: appointment.date,
          time: appointment.time,
          status: appointment.status,
          paymentMethod: appointment.paymentMethod,
          paymentMethodName: paymentMethodName,
          paymentStatus: appointment.paymentStatus,
          paymentProof: appointment.paymentProof,
          notes: appointment.notes,
          createdAt: appointment.createdAt,
          updatedAt: appointment.updatedAt,
        };
      })
    );

    return enrichedAppointments;
  }

  /**
   * Crea una nueva cita con validación de disponibilidad
   * Previene race conditions usando transacciones
   */
  async createAppointment(data: {
    userId: string;
    barberId: string;
    serviceId?: string;
    date: Date;
    time: string;
    paymentMethod: string;
    paymentProof?: string;
    notes?: string;
  }) {
    // Usar transacción para prevenir race conditions
    return await prisma.$transaction(async (tx: any) => {
      // 1. Verificar que el slot esté disponible
      const availableSlots = await barberAvailabilityService.getAvailableSlots(
        data.barberId,
        data.date,
      );

      if (!availableSlots.includes(data.time)) {
        throw new Error(
          `El horario ${data.time} no está disponible para esta fecha`,
        );
      }

      // 2. Verificar que no haya otra cita en el mismo slot (doble verificación)
      const existingAppointment = await tx.appointment.findFirst({
        where: {
          barberId: data.barberId,
          date: {
            gte: new Date(data.date.getFullYear(), data.date.getMonth(), data.date.getDate(), 0, 0, 0, 0),
            lte: new Date(data.date.getFullYear(), data.date.getMonth(), data.date.getDate(), 23, 59, 59, 999),
          },
          time: data.time,
          status: {
            not: 'CANCELLED',
          },
        },
      });

      if (existingAppointment) {
        throw new Error(
          `El horario ${data.time} ya está reservado por otro cliente`,
        );
      }

      // 3. Crear la cita
      const appointment = await tx.appointment.create({
        data: {
          userId: data.userId,
          barberId: data.barberId,
          serviceId: data.serviceId || null,
          date: new Date(data.date.getFullYear(), data.date.getMonth(), data.date.getDate()),
          time: data.time,
          paymentMethod: data.paymentMethod,
          paymentProof: data.paymentProof || null,
          paymentStatus: data.paymentProof ? 'PENDING' : null,
          notes: data.notes || null,
          status: 'PENDING',
        },
        include: {
          barber: {
            include: {
              specialtyRef: true,
            },
          },
          service: true,
        },
      });

      // 4. Enriquecer con datos del usuario del barbero
      const barber = appointment.barber;
      const user = await tx.user.findUnique({
        where: { email: barber.email },
        select: { avatar: true, avatarSeed: true },
      });

      // Get payment method name if paymentMethod ID exists
      let paymentMethodName = null;
      if (appointment.paymentMethod) {
        const paymentMethod = await tx.paymentMethod.findUnique({
          where: { id: appointment.paymentMethod },
          select: { name: true },
        });
        paymentMethodName = paymentMethod?.name || null;
      }

      const appointmentData = {
        id: appointment.id,
        barberId: appointment.barberId,
        serviceId: appointment.serviceId,
        userId: appointment.userId,
        barber: {
          id: barber.id,
          name: barber.name,
          email: barber.email,
          specialty: barber.specialty,
          rating: barber.rating,
          image: user?.avatar || barber.image,
          avatarSeed: user?.avatarSeed || null,
          location: barber.location,
        },
        service: appointment.service ? {
          id: appointment.service.id,
          name: appointment.service.name,
          price: appointment.service.price,
          description: appointment.service.description,
        } : null,
        date: appointment.date,
        time: appointment.time,
        status: appointment.status,
        paymentMethod: appointment.paymentMethod,
        paymentMethodName: paymentMethodName,
        paymentStatus: appointment.paymentStatus,
        paymentProof: appointment.paymentProof,
        notes: appointment.notes,
        createdAt: appointment.createdAt,
        updatedAt: appointment.updatedAt,
      };

      // Emitir evento de cita creada después de la transacción
      // Hacerlo fuera de la transacción para evitar problemas
      setImmediate(() => {
        try {
          emitToBarberRoom(
            appointment.barberId,
            'appointment:created',
            appointmentData as AppointmentCreatedData
          );
        } catch (error) {
          console.error('Error emitting appointment:created event:', error);
        }
      });

      return appointmentData;
    });
  }

  /**
   * Obtiene todas las citas con paginación (para admin)
   */
  async getAllAppointments(page: number = 1, limit: number = 10, search?: string, status?: string, dateFrom?: Date, dateTo?: Date) {
    const skip = (page - 1) * limit;
    
    const where: any = {};
    
    if (search) {
      where.OR = [
        { user: { name: { contains: search } } },
        { user: { email: { contains: search } } },
        { barber: { name: { contains: search } } },
        { barber: { email: { contains: search } } },
      ];
    }
    
    if (status) {
      where.status = status;
    }
    
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) {
        where.date.gte = dateFrom;
      }
      if (dateTo) {
        where.date.lte = dateTo;
      }
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              avatar: true,
              avatarSeed: true,
            },
          },
          barber: {
            include: {
              specialtyRef: true,
            },
          },
          service: true,
        },
        skip,
        take: limit,
        orderBy: {
          date: 'desc',
        },
      }),
      prisma.appointment.count({ where }),
    ]);

    const enrichedAppointments = await Promise.all(
      appointments.map(async (appointment: any) => {
        const barber = appointment.barber;
        const barberUser = await prisma.user.findUnique({
          where: { email: barber.email },
          select: { avatar: true, avatarSeed: true },
        });

        // Get payment method name if paymentMethod ID exists
        let paymentMethodName = null;
        if (appointment.paymentMethod) {
          const paymentMethod = await prisma.paymentMethod.findUnique({
            where: { id: appointment.paymentMethod },
            select: { name: true },
          });
          paymentMethodName = paymentMethod?.name || null;
        }

        return {
          id: appointment.id,
          userId: appointment.userId,
          barberId: appointment.barberId,
          serviceId: appointment.serviceId,
          client: {
            id: appointment.user.id,
            name: appointment.user.name,
            email: appointment.user.email,
            phone: appointment.user.phone,
            avatar: appointment.user.avatar,
            avatarSeed: appointment.user.avatarSeed,
          },
          barber: {
            id: barber.id,
            name: barber.name,
            email: barber.email,
            specialty: barber.specialty,
            rating: barber.rating,
            image: barberUser?.avatar || barber.image,
            avatarSeed: barberUser?.avatarSeed || null,
            location: barber.location,
          },
          service: appointment.service ? {
            id: appointment.service.id,
            name: appointment.service.name,
            price: appointment.service.price,
            description: appointment.service.description,
          } : null,
          date: appointment.date,
          time: appointment.time,
          status: appointment.status,
          paymentMethod: appointment.paymentMethod,
          paymentMethodName: paymentMethodName,
          paymentStatus: appointment.paymentStatus,
          paymentProof: appointment.paymentProof,
          notes: appointment.notes,
          createdAt: appointment.createdAt,
          updatedAt: appointment.updatedAt,
        };
      })
    );

    return {
      appointments: enrichedAppointments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtiene una cita por ID (para admin)
   */
  async getAppointmentById(id: string) {
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
            avatarSeed: true,
          },
        },
        barber: {
          include: {
            specialtyRef: true,
          },
        },
        service: true,
      },
    });

    if (!appointment) {
      throw new Error('Appointment not found');
    }

    const barber = appointment.barber;
    const barberUser = await prisma.user.findUnique({
      where: { email: barber.email },
      select: { avatar: true, avatarSeed: true },
    });

    // Get payment method name if paymentMethod ID exists
    let paymentMethodName = null;
    if (appointment.paymentMethod) {
      const paymentMethod = await prisma.paymentMethod.findUnique({
        where: { id: appointment.paymentMethod },
        select: { name: true },
      });
      paymentMethodName = paymentMethod?.name || null;
    }

    return {
      id: appointment.id,
      userId: appointment.userId,
      barberId: appointment.barberId,
      serviceId: appointment.serviceId,
      client: {
        id: appointment.user.id,
        name: appointment.user.name,
        email: appointment.user.email,
        phone: appointment.user.phone,
        avatar: appointment.user.avatar,
        avatarSeed: appointment.user.avatarSeed,
      },
      barber: {
        id: barber.id,
        name: barber.name,
        email: barber.email,
        specialty: barber.specialty,
        rating: barber.rating,
        image: barberUser?.avatar || barber.image,
        avatarSeed: barberUser?.avatarSeed || null,
        location: barber.location,
      },
      service: appointment.service ? {
        id: appointment.service.id,
        name: appointment.service.name,
        price: appointment.service.price,
        description: appointment.service.description,
      } : null,
      date: appointment.date,
      time: appointment.time,
      status: appointment.status,
      paymentMethod: appointment.paymentMethod,
      paymentMethodName: paymentMethodName,
      paymentStatus: appointment.paymentStatus,
      paymentProof: appointment.paymentProof,
      notes: appointment.notes,
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt,
    };
  }

  /**
   * Obtiene citas con comprobante de pago (para admin)
   * @param page - Número de página
   * @param limit - Límite de resultados por página
   * @param paymentStatus - Filtro opcional por estado de pago (PENDING, VERIFIED, REJECTED, o null para todos)
   */
  async getPendingPaymentAppointments(page: number = 1, limit: number = 10, paymentStatus?: string | null) {
    const skip = (page - 1) * limit;

    const whereClause: any = {
      paymentProof: { not: null },
    };

    // Si se especifica un estado, filtrar por él; si es null, mostrar todos
    if (paymentStatus !== undefined && paymentStatus !== null && paymentStatus !== '') {
      whereClause.paymentStatus = paymentStatus;
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              avatar: true,
              avatarSeed: true,
            },
          },
          barber: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          service: {
            select: {
              id: true,
              name: true,
              price: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.appointment.count({
        where: whereClause,
      }),
    ]);

    const enrichedAppointments = await Promise.all(
      appointments.map(async (appointment: any) => {
        // Get payment method name if paymentMethod ID exists
        let paymentMethodName = null;
        if (appointment.paymentMethod) {
          const paymentMethod = await prisma.paymentMethod.findUnique({
            where: { id: appointment.paymentMethod },
            select: { name: true },
          });
          paymentMethodName = paymentMethod?.name || null;
        }

        return {
          id: appointment.id,
          userId: appointment.userId,
          barberId: appointment.barberId,
          serviceId: appointment.serviceId,
          client: {
            id: appointment.user.id,
            name: appointment.user.name,
            email: appointment.user.email,
            phone: appointment.user.phone,
            avatar: appointment.user.avatar,
            avatarSeed: appointment.user.avatarSeed,
          },
          barber: appointment.barber ? {
            id: appointment.barber.id,
            name: appointment.barber.name,
            email: appointment.barber.email,
          } : null,
          service: appointment.service,
          date: appointment.date,
          time: appointment.time,
          status: appointment.status,
          paymentMethod: appointment.paymentMethod,
          paymentMethodName: paymentMethodName,
          paymentStatus: appointment.paymentStatus,
          paymentProof: appointment.paymentProof,
          notes: appointment.notes,
          createdAt: appointment.createdAt,
          updatedAt: appointment.updatedAt,
        };
      })
    );

    return {
      appointments: enrichedAppointments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Verifica o rechaza un pago (para admin)
   */
  async verifyPayment(id: string, verified: boolean) {
    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        paymentStatus: verified ? 'VERIFIED' : 'REJECTED',
        status: verified ? 'CONFIRMED' : 'PENDING',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
            avatarSeed: true,
          },
        },
        barber: {
          include: {
            specialtyRef: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            price: true,
            description: true,
          },
        },
      },
    });

    // Enriquecer con datos del usuario del barbero
    const barber = appointment.barber;
    const barberUser = await prisma.user.findUnique({
      where: { email: barber.email },
      select: { avatar: true, avatarSeed: true },
    });

    // Get payment method name if paymentMethod ID exists
    let paymentMethodName = null;
    if (appointment.paymentMethod) {
      const paymentMethod = await prisma.paymentMethod.findUnique({
        where: { id: appointment.paymentMethod },
        select: { name: true },
      });
      paymentMethodName = paymentMethod?.name || null;
    }

    const appointmentData = {
      id: appointment.id,
      userId: appointment.userId,
      barberId: appointment.barberId,
      serviceId: appointment.serviceId,
      client: {
        id: appointment.user.id,
        name: appointment.user.name,
        email: appointment.user.email,
        phone: appointment.user.phone,
        avatar: appointment.user.avatar,
        avatarSeed: appointment.user.avatarSeed,
      },
      barber: {
        id: barber.id,
        name: barber.name,
        email: barber.email,
        specialty: barber.specialty,
        rating: barber.rating,
        image: barberUser?.avatar || barber.image,
        avatarSeed: barberUser?.avatarSeed || null,
        location: barber.location,
      },
      service: appointment.service ? {
        id: appointment.service.id,
        name: appointment.service.name,
        price: appointment.service.price,
        description: appointment.service.description,
      } : null,
      date: appointment.date,
      time: appointment.time,
      status: appointment.status,
      paymentMethod: appointment.paymentMethod,
      paymentMethodName: paymentMethodName,
      paymentStatus: appointment.paymentStatus,
      paymentProof: appointment.paymentProof,
      notes: appointment.notes,
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt,
    };

    // Emitir evento de pago verificado
    if (appointment.barberId) {
      try {
        emitToBarberRoom(
          appointment.barberId,
          'appointment:payment-verified',
          appointmentData as AppointmentPaymentVerifiedData
        );
      } catch (error) {
        console.error('Error emitting appointment:payment-verified event:', error);
      }
    }

    return appointmentData;
  }

  /**
   * Actualiza una cita (para admin)
   */
  async updateAppointment(id: string, data: {
    status?: string;
    date?: Date;
    time?: string;
    paymentMethod?: string;
    paymentStatus?: string;
    notes?: string;
  }) {
    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        ...(data.status && { status: data.status }),
        ...(data.date && { date: data.date }),
        ...(data.time && { time: data.time }),
        ...(data.paymentMethod && { paymentMethod: data.paymentMethod }),
        ...(data.paymentStatus !== undefined && { paymentStatus: data.paymentStatus }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
            avatarSeed: true,
          },
        },
        barber: {
          include: {
            specialtyRef: true,
          },
        },
        service: true,
      },
    });

    const barber = appointment.barber;
    const barberUser = await prisma.user.findUnique({
      where: { email: barber.email },
      select: { avatar: true, avatarSeed: true },
    });

    // Get payment method name if paymentMethod ID exists
    let paymentMethodName = null;
    if (appointment.paymentMethod) {
      const paymentMethod = await prisma.paymentMethod.findUnique({
        where: { id: appointment.paymentMethod },
        select: { name: true },
      });
      paymentMethodName = paymentMethod?.name || null;
    }

    const appointmentData = {
      id: appointment.id,
      userId: appointment.userId,
      barberId: appointment.barberId,
      serviceId: appointment.serviceId,
      client: {
        id: appointment.user.id,
        name: appointment.user.name,
        email: appointment.user.email,
        phone: appointment.user.phone,
        avatar: appointment.user.avatar,
        avatarSeed: appointment.user.avatarSeed,
      },
      barber: {
        id: barber.id,
        name: barber.name,
        email: barber.email,
        specialty: barber.specialty,
        rating: barber.rating,
        image: barberUser?.avatar || barber.image,
        avatarSeed: barberUser?.avatarSeed || null,
        location: barber.location,
      },
      service: appointment.service ? {
        id: appointment.service.id,
        name: appointment.service.name,
        price: appointment.service.price,
        description: appointment.service.description,
      } : null,
      date: appointment.date,
      time: appointment.time,
      status: appointment.status,
      paymentMethod: appointment.paymentMethod,
      paymentMethodName: paymentMethodName,
      paymentStatus: appointment.paymentStatus,
      paymentProof: appointment.paymentProof,
      notes: appointment.notes,
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt,
    };

    // Emitir evento de cita actualizada
    try {
      emitToBarberRoom(
        appointment.barberId,
        'appointment:updated',
        appointmentData as AppointmentUpdatedData
      );
    } catch (error) {
      console.error('Error emitting appointment:updated event:', error);
    }

    return appointmentData;
  }

  /**
   * Elimina una cita (para admin)
   */
  async deleteAppointment(id: string) {
    // Obtener información de la cita antes de eliminarla para emitir evento
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      select: {
        id: true,
        barberId: true,
        date: true,
        time: true,
      },
    });

    if (!appointment) {
      throw new Error('Appointment not found');
    }

    await prisma.appointment.delete({
      where: { id },
    });

    // Emitir evento de cita cancelada
    try {
      emitToBarberRoom(
        appointment.barberId,
        'appointment:cancelled',
        {
          id: appointment.id,
          barberId: appointment.barberId,
          date: appointment.date,
          time: appointment.time,
        } as AppointmentCancelledData
      );
    } catch (error) {
      console.error('Error emitting appointment:cancelled event:', error);
    }
  }
}

export default new AppointmentService();
