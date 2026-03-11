import prisma from '../config/prisma';
import barberAvailabilityService from './barber-availability.service';
import { emitToBarberRoom } from '../socket/socket.server';
import { AppointmentCreatedData, AppointmentUpdatedData, AppointmentCancelledData, AppointmentPaymentVerifiedData } from '../socket/socket.types';
import notificationService from './notification.service';
import { formatDateTimeInSpanish } from '../utils/date-formatter';

export class AppointmentService {
  async getAppointmentsByUserId(userId: string) {
    const appointments = await prisma.appointment.findMany({
      where: { userId },
      include: {
        barber: {
          select: {
            id: true,
            name: true,
            email: true,
            specialty: true,
            rating: true,
            image: true,
            location: true,
            latitude: true,
            longitude: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
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
          select: { avatar: true, avatarSeed: true, phone: true },
        }) as { avatar: string | null; avatarSeed: string | null; phone: string | null } | null;

        return {
          id: appointment.id,
          barberId: appointment.barberId,
          barber: {
            id: barber.id,
            name: barber.name,
            specialty: barber.specialty,
            rating: barber.rating,
            image: user?.avatar || barber.image,
            avatarSeed: user?.avatarSeed || null,
            location: barber.location,
            latitude: barber.latitude,
            longitude: barber.longitude,
            phone: user?.phone || null,
          },
          service: appointment.service ? {
            id: appointment.service.id,
            name: appointment.service.name,
            description: appointment.service.description,
            price: appointment.service.price,
          } : null,
          serviceId: appointment.serviceId,
          date: appointment.date,
          time: appointment.time,
          status: appointment.status,
          paymentStatus: appointment.paymentStatus,
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
            avatar: true,
            avatarSeed: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    return appointments.map((appointment: any) => ({
      id: appointment.id,
      userId: appointment.userId,
      client: appointment.user ? {
        id: appointment.user.id,
        name: appointment.user.name,
        avatar: appointment.user.avatar,
        avatarSeed: appointment.user.avatarSeed,
      } : {
        id: 'guest',
        name: appointment.clientName || 'Cliente Invitado',
        avatar: null,
        avatarSeed: null,
      },
      clientName: appointment.clientName,
      clientPhone: appointment.clientPhone,
      service: appointment.service ? {
        id: appointment.service.id,
        name: appointment.service.name,
        description: appointment.service.description,
        price: appointment.service.price,
      } : null,
      serviceId: appointment.serviceId,
      date: appointment.date,
      time: appointment.time,
      status: appointment.status,
      paymentStatus: appointment.paymentStatus,
    }));
  }

  /**
   * Crea una nueva cita con validación de disponibilidad
   * Previene race conditions usando transacciones
   */
  async createAppointment(data: {
    userId?: string | null;
    barberId: string;
    serviceId?: string;
    date: Date;
    time: string;
    paymentMethod: string;
    paymentProof?: string;
    notes?: string;
    clientCurrentTime?: string | null;
    clientName?: string;
    clientPhone?: string;
  }) {
    // Validar que se tenga un usuario o nombre de cliente
    if (!data.userId && !data.clientName) {
      throw new Error('Debe proporcionar un userId o un nombre de cliente');
    }

    // Usar transacción para prevenir race conditions
    return await prisma.$transaction(async (tx: any) => {
      // 1. Verificar que el slot esté disponible
      const availableSlots = await barberAvailabilityService.getAvailableSlots(
        data.barberId,
        data.date,
        data.clientCurrentTime, // Pasar la hora del cliente para validación correcta
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
          userId: data.userId || null,
          barberId: data.barberId,
          serviceId: data.serviceId || null,
          date: new Date(data.date.getFullYear(), data.date.getMonth(), data.date.getDate()),
          time: data.time,
          paymentMethod: data.paymentMethod,
          paymentProof: data.paymentProof || null,
          paymentStatus: data.paymentProof ? 'PENDING' : null,
          notes: data.notes || null,
          status: 'PENDING',
          clientName: data.clientName || null,
          clientPhone: data.clientPhone || null,
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
        select: { avatar: true, avatarSeed: true, phone: true },
      }) as { avatar: string | null; avatarSeed: string | null; phone: string | null } | null;

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
        clientName: appointment.clientName,
        clientPhone: appointment.clientPhone,
        barber: {
          id: barber.id,
          name: barber.name,
          email: barber.email,
          specialty: barber.specialty,
          rating: barber.rating,
          image: user?.avatar || barber.image,
          avatarSeed: user?.avatarSeed || null,
          location: barber.location,
          phone: user?.phone || null,
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
            appointmentData as unknown as AppointmentCreatedData
          );
        } catch (error) {
          console.error('Error emitting appointment:created event:', error);
        }
      });

      // Enviar notificación push al barbero
      setImmediate(async () => {
        try {
          // Obtener el usuario del barbero para obtener su userId
          const barberUser = await prisma.user.findUnique({
            where: { email: barber.email },
            select: { id: true, email: true },
          });

          if (!barberUser) {
            console.log(`⚠️  No user found for barber email: ${barber.email} (barberId: ${appointment.barberId})`);
            return;
          }

          let clientDisplayName = 'Un cliente';
          if (data.userId) {
            const client = await prisma.user.findUnique({
              where: { id: data.userId },
              select: { name: true },
            });
            clientDisplayName = client?.name || 'Un cliente';
          } else if (data.clientName) {
            clientDisplayName = data.clientName;
          }

          const dateTimeStr = formatDateTimeInSpanish(appointment.date, appointment.time);

          console.log(`📤 Sending notification to barber user: ${barberUser.id} (${barberUser.email}) for appointment: ${appointment.id}`);

          await notificationService.sendNotificationToUser(barberUser.id, {
            title: 'Nueva Cita Reservada',
            body: `${clientDisplayName} ha reservado una cita para el ${dateTimeStr}`,
            data: {
              type: 'appointment_created',
              appointmentId: appointment.id,
              barberId: appointment.barberId,
            },
          });

          // Enviar notificación al cliente (si está registrado)
          if (data.userId) {
            await notificationService.sendNotificationToUser(data.userId, {
              title: 'Cita confirmada 📅',
              body: `Tu cita con ${barber.name} es el ${dateTimeStr}.`,
              data: {
                type: 'appointment_created_client',
                appointmentId: appointment.id,
              },
            });
          }
        } catch (error) {
          console.error('Error sending notification to barber:', error);
          // No fallar la operación si la notificación falla
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
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { barber: { name: { contains: search, mode: 'insensitive' } } },
        { barber: { email: { contains: search, mode: 'insensitive' } } },
        { clientName: { contains: search, mode: 'insensitive' } },
        { clientPhone: { contains: search, mode: 'insensitive' } },
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
          select: { avatar: true, avatarSeed: true, phone: true },
        }) as { avatar: string | null; avatarSeed: string | null; phone: string | null } | null;

        // Get payment method name if paymentMethod ID exists
        let paymentMethodName = null;
        if (appointment.paymentMethod) {
          const paymentMethod = await prisma.paymentMethod.findUnique({
            where: { id: appointment.paymentMethod },
            select: { name: true },
          });
          paymentMethodName = paymentMethod?.name || null;
        }

        // Get active promotion for this barber at the time of the appointment
        const appointmentDate = new Date(appointment.date);
        const activePromotion = await prisma.promotion.findFirst({
          where: {
            barberId: appointment.barberId,
            isActive: true,
            validFrom: { lte: appointmentDate },
            validUntil: { gte: appointmentDate },
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        return {
          id: appointment.id,
          userId: appointment.userId,
          barberId: appointment.barberId,
          serviceId: appointment.serviceId,
          client: {
            id: appointment.user?.id || 'guest',
            name: appointment.user?.name || appointment.clientName || 'Cliente Invitado',
            email: appointment.user?.email || '',
            phone: appointment.user?.phone || appointment.clientPhone || '',
            avatar: appointment.user?.avatar || null,
            avatarSeed: appointment.user?.avatarSeed || null,
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
          promotion: activePromotion ? {
            id: activePromotion.id,
            title: activePromotion.title,
            code: activePromotion.code,
            discount: activePromotion.discount,
            discountAmount: activePromotion.discountAmount,
            description: activePromotion.description,
          } : null,
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
      select: { avatar: true, avatarSeed: true, phone: true },
    }) as { avatar: string | null; avatarSeed: string | null; phone: string | null } | null;

    // Get payment method name if paymentMethod ID exists
    let paymentMethodName = null;
    if (appointment.paymentMethod) {
      const paymentMethod = await prisma.paymentMethod.findUnique({
        where: { id: appointment.paymentMethod },
        select: { name: true },
      });
      paymentMethodName = paymentMethod?.name || null;
    }

    // Get active promotion for this barber at the time of the appointment
    const appointmentDate = new Date(appointment.date);
    const activePromotion = await prisma.promotion.findFirst({
      where: {
        barberId: appointment.barberId,
        isActive: true,
        validFrom: { lte: appointmentDate },
        validUntil: { gte: appointmentDate },
      },
      orderBy: {
        createdAt: 'desc', // Get the most recent promotion if multiple
      },
    });

    return {
      id: appointment.id,
      userId: appointment.userId,
      barberId: appointment.barberId,
      serviceId: appointment.serviceId,
      client: {
        id: appointment.user?.id || 'guest',
        name: appointment.user?.name || appointment.clientName || 'Cliente Invitado',
        email: appointment.user?.email || '',
        phone: appointment.user?.phone || appointment.clientPhone || '',
        avatar: appointment.user?.avatar || null,
        avatarSeed: appointment.user?.avatarSeed || null,
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
        latitude: barber.latitude,
        longitude: barber.longitude,
        phone: barberUser?.phone || null,
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
      clientName: appointment.clientName,
      clientPhone: appointment.clientPhone,
      promotion: activePromotion ? {
        id: activePromotion.id,
        title: activePromotion.title,
        code: activePromotion.code,
        discount: activePromotion.discount,
        discountAmount: activePromotion.discountAmount,
        description: activePromotion.description,
      } : null,
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

        // Get active promotion for this barber at the time of the appointment
        const appointmentDate = new Date(appointment.date);
        const activePromotion = appointment.barberId ? await prisma.promotion.findFirst({
          where: {
            barberId: appointment.barberId,
            isActive: true,
            validFrom: { lte: appointmentDate },
            validUntil: { gte: appointmentDate },
          },
          orderBy: {
            createdAt: 'desc',
          },
        }) : null;

        return {
          id: appointment.id,
          userId: appointment.userId,
          barberId: appointment.barberId,
          serviceId: appointment.serviceId,
          client: {
            id: appointment.user?.id || 'guest',
            name: appointment.user?.name || appointment.clientName || 'Cliente Invitado',
            email: appointment.user?.email || '',
            phone: appointment.user?.phone || appointment.clientPhone || '',
            avatar: appointment.user?.avatar || null,
            avatarSeed: appointment.user?.avatarSeed || null,
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
          clientName: appointment.clientName,
          clientPhone: appointment.clientPhone,
          promotion: activePromotion ? {
            id: activePromotion.id,
            title: activePromotion.title,
            code: activePromotion.code,
            discount: activePromotion.discount,
            discountAmount: activePromotion.discountAmount,
            description: activePromotion.description,
          } : null,
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

    // Get active promotion for this barber at the time of the appointment
    const appointmentDate = new Date(appointment.date);
    const activePromotion = await prisma.promotion.findFirst({
      where: {
        barberId: appointment.barberId,
        isActive: true,
        validFrom: { lte: appointmentDate },
        validUntil: { gte: appointmentDate },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const appointmentData = {
      id: appointment.id,
      userId: appointment.userId,
      barberId: appointment.barberId,
      serviceId: appointment.serviceId,
      client: {
        id: appointment.user?.id || 'guest',
        name: appointment.user?.name || appointment.clientName || 'Cliente Invitado',
        email: appointment.user?.email || '',
        phone: appointment.user?.phone || appointment.clientPhone || '',
        avatar: appointment.user?.avatar || null,
        avatarSeed: appointment.user?.avatarSeed || null,
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
      clientName: appointment.clientName,
      clientPhone: appointment.clientPhone,
      promotion: activePromotion ? {
        id: activePromotion.id,
        title: activePromotion.title,
        code: activePromotion.code,
        discount: activePromotion.discount,
        discountAmount: activePromotion.discountAmount,
        description: activePromotion.description,
      } : null,
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

    // Enviar notificaciones push
    setImmediate(async () => {
      try {
        const dateTimeStr = formatDateTimeInSpanish(appointment.date, appointment.time);
        const barberUser = await prisma.user.findUnique({
          where: { email: barber.email },
          select: { id: true },
        });

        if (verified) {
          // Pago verificado - notificar a cliente (SI EXISTE) y barbero
          if (appointment.userId) {
            await notificationService.sendNotificationToUser(appointment.userId, {
              title: 'Pago Verificado ✅',
              body: `Tu pago ha sido verificado. Tu cita con ${barber.name} está confirmada para el ${dateTimeStr}`,
              data: {
                type: 'payment_verified',
                appointmentId: appointment.id,
                userId: appointment.userId,
              },
            });
          }

          if (barberUser) {
            const clientName = appointment.user?.name || appointment.clientName || 'Un cliente';
            await notificationService.sendNotificationToUser(barberUser.id, {
              title: 'Pago Recibido 💰',
              body: `Se ha verificado el pago de ${clientName}`,
              data: {
                type: 'payment_verified',
                appointmentId: appointment.id,
                barberId: appointment.barberId,
              },
            });
          }
        } else if (appointment.userId) {
          // Pago rechazado - notificar solo al cliente (SI EXISTE)
          await notificationService.sendNotificationToUser(appointment.userId, {
            title: 'Pago Rechazado ❌',
            body: `Tu comprobante de pago no pudo ser verificado. Por favor contacta al soporte o intenta nuevamente.`,
            data: {
              type: 'payment_rejected',
              appointmentId: appointment.id,
              userId: appointment.userId,
            },
          });
        }
      } catch (error) {
        console.error('Error sending payment notification:', error);
      }
    });

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
    // Obtener la cita antes de actualizarla para detectar cambios
    const oldAppointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        barber: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

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
      client: appointment.user ? {
        id: appointment.user.id,
        name: appointment.user.name,
        email: appointment.user.email,
        phone: appointment.user.phone,
        avatar: appointment.user.avatar,
        avatarSeed: appointment.user.avatarSeed,
      } : {
        id: 'guest',
        name: appointment.clientName || 'Cliente',
        email: '',
        phone: appointment.clientPhone || '',
        avatar: null,
        avatarSeed: null,
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

    // Enviar notificaciones push según los cambios
    setImmediate(async () => {
      try {
        if (!oldAppointment) return;

        const dateTimeStr = formatDateTimeInSpanish(appointment.date, appointment.time);
        const barberUser = await prisma.user.findUnique({
          where: { email: barber.email },
          select: { id: true },
        });

        // Detectar cambios en el estado
        if (data.status && data.status !== oldAppointment.status) {
          // Nota: Las cancelaciones se manejan en el controlador con contexto de quién canceló
          // Solo enviamos notificación si se cancela desde otro lugar (ej: admin)
          if (data.status === 'CANCELLED') {
            // Solo notificar si no viene del controlador (el controlador maneja sus propias notificaciones)
            // Por ahora, no enviamos notificación aquí para evitar duplicados
            // El controlador de cancelAppointment maneja las notificaciones con el contexto correcto
          } else if (data.status === 'COMPLETED') {
            // Cita completada - notificar al cliente (SI EXISTE)
            if (appointment.userId) {
              await notificationService.sendNotificationToUser(appointment.userId, {
                title: 'Cita Completada',
                body: `Tu cita con ${barber.name} ha sido completada. ¡Gracias por tu visita!`,
                data: {
                  type: 'appointment_completed',
                  appointmentId: appointment.id,
                  userId: appointment.userId,
                },
              });
            }
          }
        }

        // Detectar cambios en fecha o hora
        const dateChanged = data.date && oldAppointment.date.getTime() !== appointment.date.getTime();
        const timeChanged = data.time && oldAppointment.time !== appointment.time;

        if (dateChanged || timeChanged) {
          // Notificar a cliente (SI EXISTE) y barbero sobre el cambio
          if (appointment.userId) {
            await notificationService.sendNotificationToUser(appointment.userId, {
              title: 'Cita Modificada',
              body: `Tu cita con ${barber.name} ha sido modificada. Nueva fecha: ${dateTimeStr}`,
              data: {
                type: 'appointment_updated',
                appointmentId: appointment.id,
                userId: appointment.userId,
                changeType: 'date_time',
              },
            });
          }

          if (barberUser) {
            const clientName = appointment.user?.name || appointment.clientName || 'Un cliente';
            await notificationService.sendNotificationToUser(barberUser.id, {
              title: 'Cita Modificada',
              body: `La cita con ${clientName} ha sido modificada. Nueva fecha: ${dateTimeStr}`,
              data: {
                type: 'appointment_updated',
                appointmentId: appointment.id,
                barberId: appointment.barberId,
                changeType: 'date_time',
              },
            });
          }
        }
      } catch (error) {
        console.error('Error sending update notifications:', error);
        // No fallar la operación si la notificación falla
      }
    });

    return appointmentData;
  }

  /**
   * Elimina una cita (para admin)
   */
  async deleteAppointment(id: string) {
    // Obtener información de la cita antes de eliminarla para emitir evento
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        barber: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!appointment) {
      throw new Error('Appointment not found');
    }

    const dateTimeStr = formatDateTimeInSpanish(appointment.date, appointment.time);

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

    // Enviar notificaciones push
    setImmediate(async () => {
      try {
        const barberUser = await prisma.user.findUnique({
          where: { email: appointment.barber.email },
          select: { id: true },
        });

        // Notificar al cliente (SI EXISTE)
        if (appointment.userId) {
          await notificationService.sendNotificationToUser(appointment.userId, {
            title: 'Cita Eliminada',
            body: `Tu cita con ${appointment.barber.name} para el ${dateTimeStr} ha sido eliminada`,
            data: {
              type: 'appointment_deleted',
              appointmentId: appointment.id,
              userId: appointment.userId,
            },
          });
        }

        // Notificar al barbero
        if (barberUser) {
          const clientName = appointment.user?.name || appointment.clientName || 'Un cliente';
          await notificationService.sendNotificationToUser(barberUser.id, {
            title: 'Cita Eliminada',
            body: `La cita con ${clientName} para el ${dateTimeStr} ha sido eliminada`,
            data: {
              type: 'appointment_deleted',
              appointmentId: appointment.id,
              barberId: appointment.barberId,
            },
          });
        }
      } catch (error) {
        console.error('Error sending delete notifications:', error);
        // No fallar la operación si la notificación falla
      }
    });
  }
}

export default new AppointmentService();
