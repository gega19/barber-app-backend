import prisma from '../config/prisma';

export class BarberAvailabilityService {
  /**
   * Crea la disponibilidad por defecto para un barbero
   * Lunes-Sábado: 08:00 - 18:00
   * Domingo: Cerrado
   */
  async createDefaultAvailability(barberId: string) {
    const defaultSchedule = [
      // Domingo (0) - Cerrado
      { dayOfWeek: 0, startTime: '08:00', endTime: '18:00', isAvailable: false },
      // Lunes (1) - Viernes (5) - 08:00 - 18:00
      { dayOfWeek: 1, startTime: '08:00', endTime: '18:00', isAvailable: true },
      { dayOfWeek: 2, startTime: '08:00', endTime: '18:00', isAvailable: true },
      { dayOfWeek: 3, startTime: '08:00', endTime: '18:00', isAvailable: true },
      { dayOfWeek: 4, startTime: '08:00', endTime: '18:00', isAvailable: true },
      { dayOfWeek: 5, startTime: '08:00', endTime: '18:00', isAvailable: true },
      // Sábado (6) - 08:00 - 18:00
      { dayOfWeek: 6, startTime: '08:00', endTime: '18:00', isAvailable: true },
    ];

    await prisma.barberAvailability.createMany({
      data: defaultSchedule.map((schedule) => ({
        ...schedule,
        barberId,
      })),
    });

    return this.getAvailabilityByBarberId(barberId);
  }

  /**
   * Obtiene la disponibilidad de un barbero
   */
  async getAvailabilityByBarberId(barberId: string) {
    const availability = await prisma.barberAvailability.findMany({
      where: { barberId },
      orderBy: { dayOfWeek: 'asc' },
    });

    return availability;
  }

  /**
   * Actualiza la disponibilidad de un barbero
   */
  async updateAvailability(barberId: string, availability: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isAvailable: boolean;
    breakStart?: string | null;
    breakEnd?: string | null;
  }>) {
    // Primero, eliminar toda la disponibilidad existente
    await prisma.barberAvailability.deleteMany({
      where: { barberId },
    });

    // Luego, crear la nueva disponibilidad
    await prisma.barberAvailability.createMany({
      data: availability.map((day) => ({
        barberId,
        dayOfWeek: day.dayOfWeek,
        startTime: day.startTime,
        endTime: day.endTime,
        isAvailable: day.isAvailable,
        breakStart: day.breakStart || null,
        breakEnd: day.breakEnd || null,
      })),
    });

    return this.getAvailabilityByBarberId(barberId);
  }

  /**
   * Obtiene los slots disponibles para una fecha específica
   * Considera: horario base, excepciones, y citas ya reservadas
   * @param clientCurrentTime - Hora actual del cliente en formato "HH:MM" (opcional)
   */
  async getAvailableSlots(barberId: string, date: Date, clientCurrentTime?: string | null) {
    // Asegurar que usamos la fecha local sin problemas de timezone
    // Crear una nueva fecha con año, mes y día para evitar problemas de timezone
    const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dayOfWeek = localDate.getDay(); // 0 = Domingo, 1 = Lunes, etc.

    // Verificar si hay excepción para esta fecha
    // Usar la fecha local para evitar problemas de timezone
    const exceptionDate = new Date(localDate.getFullYear(), localDate.getMonth(), localDate.getDate());
    const exception = await prisma.barberAvailabilityException.findUnique({
      where: {
        barberId_date: {
          barberId,
          date: exceptionDate,
        },
      },
    });

    let schedule;
    if (exception) {
      // Usar horario de excepción
      if (!exception.isAvailable) {
        return []; // Día cerrado
      }
      schedule = {
        startTime: exception.startTime || '08:00',
        endTime: exception.endTime || '18:00',
        breakStart: exception.breakStart,
        breakEnd: exception.breakEnd,
      };
    } else {
      // Usar horario base del día de la semana
      const baseSchedule = await prisma.barberAvailability.findUnique({
        where: {
          barberId_dayOfWeek: {
            barberId,
            dayOfWeek,
          },
        },
      });

      if (!baseSchedule || !baseSchedule.isAvailable) {
        return []; // Día cerrado o no configurado
      }

      schedule = {
        startTime: baseSchedule.startTime,
        endTime: baseSchedule.endTime,
        breakStart: baseSchedule.breakStart,
        breakEnd: baseSchedule.breakEnd,
      };
    }

    // Generar slots de 1 hora (30 min sería más común, pero por ahora 1 hora)
    const slots: string[] = [];
    const [startHour, startMin] = schedule.startTime.split(':').map(Number);
    const [endHour, endMin] = schedule.endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    let breakStartMinutes: number | null = null;
    let breakEndMinutes: number | null = null;

    if (schedule.breakStart && schedule.breakEnd) {
      const [breakStartHour, breakStartMin] = schedule.breakStart.split(':').map(Number);
      const [breakEndHour, breakEndMin] = schedule.breakEnd.split(':').map(Number);
      breakStartMinutes = breakStartHour * 60 + breakStartMin;
      breakEndMinutes = breakEndHour * 60 + breakEndMin;
    }

    // Generar slots de 1 hora
    for (let minutes = startMinutes; minutes < endMinutes; minutes += 60) {
      // Saltar si está en el break
      if (breakStartMinutes !== null && breakEndMinutes !== null) {
        if (minutes >= breakStartMinutes && minutes < breakEndMinutes) {
          continue;
        }
      }

      const hour = Math.floor(minutes / 60);
      const min = minutes % 60;
      const timeSlot = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
      slots.push(timeSlot);
    }

    // Obtener citas ya reservadas para esta fecha
    // Usar la fecha local para evitar problemas de timezone
    const startOfDay = new Date(localDate.getFullYear(), localDate.getMonth(), localDate.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(localDate.getFullYear(), localDate.getMonth(), localDate.getDate(), 23, 59, 59, 999);

    const existingAppointments = await prisma.appointment.findMany({
      where: {
        barberId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          not: 'CANCELLED',
        },
      },
      select: {
        time: true,
      },
    });

    const bookedTimes = new Set(existingAppointments.map((apt) => apt.time));

    // Filtrar slots ocupados
    const availableSlots = slots.filter((slot) => !bookedTimes.has(slot));

    // Filtrar slots en el pasado si es hoy
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (
      localDate.getFullYear() === today.getFullYear() &&
      localDate.getMonth() === today.getMonth() &&
      localDate.getDate() === today.getDate()
    ) {
      let currentMinutes: number;
      
      if (clientCurrentTime) {
        // Usar la hora del cliente si se proporciona (más preciso para zonas horarias)
        const [clientHour, clientMin] = clientCurrentTime.split(':').map(Number);
        currentMinutes = clientHour * 60 + clientMin;
      } else {
        // Fallback: usar hora local del servidor (puede tener problemas de zona horaria)
        const currentHour = now.getHours();
        const currentMin = now.getMinutes();
        currentMinutes = currentHour * 60 + currentMin;
      }
      
      // Margen de 30 minutos para dar tiempo suficiente para reservar
      const marginMinutes = 30;
      const cutoffMinutes = currentMinutes + marginMinutes;

      return availableSlots.filter((slot) => {
        const [slotHour, slotMin] = slot.split(':').map(Number);
        const slotMinutes = slotHour * 60 + slotMin;
        return slotMinutes >= cutoffMinutes;
      });
    }

    return availableSlots;
  }
}

export default new BarberAvailabilityService();

