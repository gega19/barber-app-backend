import prisma from '../config/prisma';
import { hashPassword, comparePassword } from '../utils/hash';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';

type User = {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  avatar?: string | null;
  avatarSeed?: string | null;
  location?: string | null;
  country?: string | null;
  gender?: string | null;
  role?: string | null;
  workplaceId?: string | null;
  password: string;
  createdAt: Date;
  updatedAt: Date;
};

export interface RegisterDto {
  email: string;
  password: string;
  name: string;
  phone?: string;
  location?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: Omit<User, 'password'> & { isBarber: boolean; barberId?: string; workplaceId?: string | null };
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  async register(data: RegisterDto): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password);

    // Generate default avatarSeed using email and timestamp
    const avatarSeed = `${data.email}-${Date.now()}`;

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        phone: data.phone,
        location: data.location,
        avatarSeed: avatarSeed,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        avatarSeed: true,
        location: true,
        country: true,
        gender: true,
        role: true,
        workplaceId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Generate tokens (convert enum to string)
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role.toString(),
      workplaceId: user.workplaceId || undefined,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role.toString(),
      workplaceId: user.workplaceId || undefined,
    });

    // Save refresh token
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Verificar si el usuario tiene perfil de barbero (aunque sea nuevo, por si acaso)
    const barber = await prisma.barber.findUnique({
      where: { email: user.email },
      select: { id: true },
    });

    return {
      user: {
        ...user,
        role: user.role.toString() as 'ADMIN' | 'CLIENT' | 'USER' | 'BARBERSHOP',
        isBarber: !!barber,
        barberId: barber?.id,
      },
      accessToken,
      refreshToken,
    };
  }

  async login(data: LoginDto): Promise<AuthResponse> {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        avatarSeed: true,
        location: true,
        country: true,
        gender: true,
        role: true,
        workplaceId: true,
        password: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await comparePassword(data.password, user.password);

    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Generate avatarSeed if user doesn't have one
    if (!user.avatarSeed) {
      const avatarSeed = `${user.email}-${Date.now()}`;
      await prisma.user.update({
        where: { id: user.id },
        data: { avatarSeed },
      });
      user.avatarSeed = avatarSeed;
    }

    // Generate tokens (convert enum to string)
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role.toString(),
      workplaceId: user.workplaceId || undefined,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role.toString(),
      workplaceId: user.workplaceId || undefined,
    });

    // Save refresh token
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Verificar si el usuario tiene perfil de barbero
    const barber = await prisma.barber.findUnique({
      where: { email: user.email },
      select: { id: true },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        avatar: user.avatar,
        avatarSeed: user.avatarSeed,
        location: user.location,
        country: user.country,
        gender: user.gender,
        role: user.role.toString() as 'ADMIN' | 'CLIENT' | 'USER' | 'BARBERSHOP',
        workplaceId: user.workplaceId,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        isBarber: !!barber,
        barberId: barber?.id,
      },
      accessToken,
      refreshToken,
    };
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    // Delete refresh token
    await prisma.refreshToken.deleteMany({
      where: {
        userId,
        token: refreshToken,
      },
    });
  }

  async refreshAccessToken(refreshToken: string): Promise<string> {
    // Find refresh token
    const token = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!token || token.expiresAt < new Date()) {
      throw new Error('Invalid or expired refresh token');
    }

    // Generate new access token (convert enum to string)
    const accessToken = generateAccessToken({
      userId: token.user.id,
      email: token.user.email,
      role: token.user.role.toString(),
      workplaceId: token.user.workplaceId || undefined,
    });

    return accessToken;
  }

  async getCurrentUser(userId: string): Promise<(Omit<User, 'password'> & { isBarber: boolean; barberId?: string; workplaceId?: string | null }) | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        avatarSeed: true,
        location: true,
        country: true,
        gender: true,
        role: true,
        workplaceId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return null;
    }

    // Verificar si el usuario tiene perfil de barbero
    const barber = await prisma.barber.findUnique({
      where: { email: user.email },
      select: { id: true },
    });

    // Generate avatarSeed if user doesn't have one
    if (!user.avatarSeed) {
      const avatarSeed = `${user.email}-${Date.now()}`;
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { avatarSeed },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          avatar: true,
          avatarSeed: true,
          location: true,
          country: true,
          gender: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      return {
        ...updatedUser,
        isBarber: !!barber,
        barberId: barber?.id,
      };
    }

    return {
      ...user,
      isBarber: !!barber,
      barberId: barber?.id,
    };
  }

  async getUserStats(userId: string) {
    // Get user to check role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, email: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Check if user is a barber (has a barber profile)
    const barber = await prisma.barber.findUnique({
      where: { email: user.email },
      select: { id: true, rating: true, reviews: true },
    });

    // If user is a barber, return barber stats
    if (barber) {

      // Get all appointments for this barber
      const appointments = await prisma.appointment.findMany({
        where: { barberId: barber.id },
        include: {
          user: {
            select: {
              id: true,
            },
          },
          barber: {
            select: {
              price: true,
            },
          },
        },
      });

      // Calculate barber stats
      const totalAppointments = appointments.length;
      const uniqueClients = new Set(appointments.map((a: any) => a.userId)).size;
      const completedAppointments = appointments.filter((a: any) => a.status === 'COMPLETED');

      // Calculate total earnings from completed appointments
      const totalEarnings = completedAppointments.reduce((sum: number, appointment: any) => {
        return sum + (appointment.barber.price || 0);
      }, 0);

      return {
        totalAppointments,
        uniqueClients,
        rating: barber.rating || 0.0,
        totalEarnings: Math.round(totalEarnings * 100) / 100,
      };
    }

    // Client stats (original logic)
    const appointments = await prisma.appointment.findMany({
      where: { userId },
      include: {
        barber: {
          select: {
            id: true,
            name: true,
            price: true,
          },
        },
      },
    });

    // Calculate stats
    const totalAppointments = appointments.length;
    const completedAppointments = appointments.filter((a: any) => a.status === 'COMPLETED');
    const uniqueBarbers = new Set(appointments.map((a: any) => a.barberId)).size;

    // Calculate total spent from completed appointments
    const totalSpent = completedAppointments.reduce((sum: number, appointment: any) => {
      return sum + (appointment.barber.price || 0);
    }, 0);

    return {
      totalAppointments,
      completedAppointments: completedAppointments.length,
      totalSpent: Math.round(totalSpent * 100) / 100, // Round to 2 decimals
      uniqueBarbers,
    };
  }

  async updateProfile(userId: string, data: {
    name?: string;
    phone?: string;
    location?: string;
    country?: string;
    gender?: string;
    avatar?: string;
    avatarSeed?: string;
  }): Promise<Omit<User, 'password'>> {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.location !== undefined && { location: data.location }),
        ...(data.country !== undefined && { country: data.country }),
        ...(data.gender !== undefined && { gender: data.gender }),
        ...(data.avatar !== undefined && { avatar: data.avatar }),
        ...(data.avatarSeed !== undefined && { avatarSeed: data.avatarSeed }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        avatarSeed: true,
        location: true,
        country: true,
        gender: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }

  async becomeBarber(userId: string, data: {
    specialtyId?: string;
    specialty: string;
    experienceYears: number;
    location: string;
    latitude?: number;
    longitude?: number;
    image?: string;
    workplaceId?: string;
    serviceType?: string;
  }): Promise<{ user: Omit<User, 'password'>; barberId: string }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Check if user already has a barber profile
    const existingBarber = await prisma.barber.findUnique({
      where: { email: user.email },
    });

    if (existingBarber) {
      throw new Error('User is already a barber');
    }

    let barberId = '';

    await prisma.$transaction(async (tx: any) => {
      const barber = await tx.barber.create({
        data: {
          name: user.name,
          email: user.email,
          specialty: data.specialty,
          specialtyId: data.specialtyId,
          experienceYears: data.experienceYears,
          location: data.location,
          latitude: data.latitude,
          longitude: data.longitude,
          image: data.image || user.avatar || '',
          workplaceId: data.workplaceId,
          serviceType: data.serviceType,
        },
      });

      barberId = barber.id;
    });

    // Crear disponibilidad por defecto
    const barberAvailabilityService = (await import('./barber-availability.service')).default;
    await barberAvailabilityService.createDefaultAvailability(barberId);

    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        avatarSeed: true,
        location: true,
        country: true,
        gender: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!updatedUser) {
      throw new Error('Failed to update user');
    }

    return { user: updatedUser, barberId };
  }

  async deleteAccount(userId: string, password: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      throw new Error('Contraseña incorrecta');
    }

    // Check if user has a barber profile
    const barber = await prisma.barber.findUnique({
      where: { email: user.email },
    });

    await prisma.$transaction(async (tx: any) => {
      await tx.refreshToken.deleteMany({
        where: { userId },
      });

      // Delete barber profile if exists
      if (barber) {
        await tx.barber.deleteMany({
          where: { email: user.email },
        });
      }

      await tx.user.delete({
        where: { id: userId },
      });
    });
  }

  async updateBarberStep2(userId: string, data: {
    workplaceId?: string;
    serviceType?: string;
  }): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Check if user has a barber profile
    const barber = await prisma.barber.findUnique({
      where: { email: user.email },
    });

    if (!barber) {
      throw new Error('User is not a barber or barber profile not found');
    }

    await prisma.barber.update({
      where: { id: barber.id },
      data: {
        workplaceId: data.workplaceId,
        serviceType: data.serviceType,
      },
    });
  }
}

export default new AuthService();

