import prisma from '../config/prisma';

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
}

export default new SpecialtyService();
