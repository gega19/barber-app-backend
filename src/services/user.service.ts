import prisma from '../config/prisma';
import bcrypt from 'bcrypt';
import { UserRole } from '../middleware/role.middleware';

const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 10);
};

export interface CreateUserDto {
  email: string;
  password: string;
  name: string;
  phone?: string;
  location?: string;
  role?: UserRole;
  workplaceId?: string;
  country?: string;
  gender?: string;
}

export interface UpdateUserDto {
  name?: string;
  phone?: string;
  location?: string;
  role?: UserRole;
  workplaceId?: string;
  country?: string;
  gender?: string;
  password?: string;
}

class UserService {
  async getAllUsers(
    page: number = 1,
    limit: number = 10,
    search?: string,
    filters?: {
      role?: string;
      fromDate?: Date;
      toDate?: Date;
      isBarber?: boolean;
    }
  ) {
    const skip = (page - 1) * limit;

    const where: any = {};

    // Search filter
    if (search) {
      where.OR = [
        { email: { contains: search } }, // SQLite/Postgres case differences handled by DB usually, or need mode: insensitive
        { name: { contains: search } },
      ];
    }

    // Role filter
    if (filters?.role && filters.role !== 'ALL') {
      where.role = filters.role;
    }

    // Date filter
    if (filters?.fromDate) {
      where.createdAt = {
        gte: filters.fromDate,
        ...(filters.toDate ? { lte: filters.toDate } : {}),
      };
    }

    // "Is Barber" filter
    if (filters?.isBarber !== undefined) {
      if (filters.isBarber) {
        // Native filter: Users with BARBER role (Employees) or BARBERSHOP (Managers)
        // Adjust based on strictness required. Usually "Barber" filter implies staff.
        where.role = { in: ['BARBER', 'BARBERSHOP'] };
      } else {
        where.role = { notIn: ['BARBER', 'BARBERSHOP'] };
      }
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
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
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users: users.map(user => ({
        ...user,
        role: user.role.toString(),
        isBarber: user.role === 'BARBER' || user.role === 'BARBERSHOP',
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserById(userId: string) {
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
      throw new Error('User not found');
    }

    return {
      ...user,
      role: user.role.toString(),
    };
  }

  async createUser(data: CreateUserDto) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const hashedPassword = await hashPassword(data.password);
    const avatarSeed = `${data.email}-${Date.now()}`;

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        phone: data.phone,
        location: data.location,
        role: data.role || 'USER',
        workplaceId: data.role === 'BARBERSHOP' ? data.workplaceId : undefined,
        country: data.country,
        gender: data.gender,
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

    return {
      ...user,
      role: user.role.toString(),
    };
  }

  async updateUser(userId: string, data: UpdateUserDto) {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new Error('User not found');
    }

    // Prepare update data
    const updateData: any = {
      name: data.name,
      phone: data.phone,
      location: data.location,
      country: data.country,
      gender: data.gender,
      workplaceId: data.workplaceId,
    };

    // Update role if provided
    if (data.role) {
      updateData.role = data.role;
    }

    // Update password if provided
    if (data.password) {
      updateData.password = await hashPassword(data.password);
    }

    // Remove undefined fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
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

    return {
      ...user,
      role: user.role.toString(),
    };
  }

  async deleteUser(userId: string) {
    // Check if user exists
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

    // Delete user and related data in a transaction
    await prisma.$transaction(async (tx: any) => {
      // Delete refresh tokens
      await tx.refreshToken.deleteMany({
        where: { userId },
      });

      // Delete barber profile if exists
      if (barber) {
        await tx.barber.deleteMany({
          where: { email: user.email },
        });
      }

      // Delete user
      await tx.user.delete({
        where: { id: userId },
      });
    });

    return { message: 'User deleted successfully' };
  }
}

export default new UserService();

