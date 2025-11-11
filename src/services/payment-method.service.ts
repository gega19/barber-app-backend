import prisma from '../config/prisma';

export class PaymentMethodService {
  async getActivePaymentMethods() {
    const paymentMethods = await prisma.paymentMethod.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    return paymentMethods;
  }

  async getAllPaymentMethods() {
    const paymentMethods = await prisma.paymentMethod.findMany({
      orderBy: { name: 'asc' },
    });

    return paymentMethods;
  }

  async getPaymentMethodById(id: string) {
    const paymentMethod = await prisma.paymentMethod.findUnique({
      where: { id },
    });

    return paymentMethod;
  }

  async createPaymentMethod(data: {
    name: string;
    icon?: string;
    type?: string;
    config?: any;
    isActive?: boolean;
  }) {
    const paymentMethod = await prisma.paymentMethod.create({
      data: {
        name: data.name,
        icon: data.icon,
        type: data.type || null,
        config: data.config || null,
        isActive: data.isActive ?? true,
      },
    });

    return paymentMethod;
  }

  async updatePaymentMethod(id: string, data: {
    name?: string;
    icon?: string;
    type?: string;
    config?: any;
    isActive?: boolean;
  }) {
    const paymentMethod = await prisma.paymentMethod.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.icon !== undefined && { icon: data.icon }),
        ...(data.type !== undefined && { type: data.type || null }),
        ...(data.config !== undefined && { config: data.config || null }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });

    return paymentMethod;
  }

  async deletePaymentMethod(id: string) {
    await prisma.paymentMethod.delete({
      where: { id },
    });
  }
}

export default new PaymentMethodService();

