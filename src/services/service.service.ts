import prisma from '../config/prisma';

export class ServiceService {
  async getBarberServices(barberId: string) {
    const services = await prisma.service.findMany({
      where: { barberId },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return services;
  }

  async getServiceById(id: string) {
    const service = await prisma.service.findUnique({
      where: { id },
    });
    return service;
  }

  async createService(barberId: string, data: {
    name: string;
    price: number;
    description?: string;
    includes?: string;
  }) {
    const service = await prisma.service.create({
      data: {
        barberId,
        name: data.name,
        price: data.price,
        description: data.description,
        includes: data.includes,
      },
    });
    return service;
  }

  async updateService(id: string, data: {
    name?: string;
    price?: number;
    description?: string;
    includes?: string;
  }) {
    const service = await prisma.service.update({
      where: { id },
      data,
    });
    return service;
  }

  async deleteService(id: string) {
    await prisma.service.delete({
      where: { id },
    });
  }

  async createMultipleServices(barberId: string, services: Array<{
    name: string;
    price: number;
    description?: string;
    includes?: string;
  }>) {
    const createdServices = await prisma.$transaction(
      services.map(service => 
        prisma.service.create({
          data: {
            barberId,
            name: service.name,
            price: service.price,
            description: service.description,
            includes: service.includes,
          },
        })
      )
    );
    return createdServices;
  }
}

export default new ServiceService();
