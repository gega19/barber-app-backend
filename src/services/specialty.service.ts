import prisma from '../config/prisma';

export interface CreateSpecialtyData {
  name: string;
  description?: string;
}

export interface UpdateSpecialtyData {
  name?: string;
  description?: string;
}

export class SpecialtyService {
  async getSpecialties() {
    const specialties = await prisma.specialty.findMany({
      orderBy: {
        name: 'asc',
      },
    });
    return specialties;
  }

  async getSpecialtyById(id: string) {
    const specialty = await prisma.specialty.findUnique({
      where: { id },
    });
    return specialty;
  }

  async createSpecialty(data: CreateSpecialtyData) {
    const specialty = await prisma.specialty.create({
      data: {
        name: data.name,
        description: data.description,
      },
    });
    return specialty;
  }

  async updateSpecialty(id: string, data: UpdateSpecialtyData) {
    const specialty = await prisma.specialty.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
      },
    });
    return specialty;
  }

  async deleteSpecialty(id: string) {
    // Verificar si hay barberos usando esta especialidad
    const barbersWithSpecialty = await prisma.barber.count({
      where: { specialtyId: id },
    });

    if (barbersWithSpecialty > 0) {
      throw new Error(
        `No se puede eliminar la especialidad porque ${barbersWithSpecialty} barbero(s) la están usando`
      );
    }

    const specialty = await prisma.specialty.delete({
      where: { id },
    });
    return specialty;
  }
}

export default new SpecialtyService();
