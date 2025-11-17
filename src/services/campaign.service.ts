import prisma from '../config/prisma';
import notificationService from './notification.service';
import fcmTokenService from './fcm-token.service';

export interface CreateCampaignDto {
  title: string;
  message: string;
  targetType: 'all' | 'specific_users' | 'barbers_only' | 'clients_only';
  targetUserIds?: string[];
  createdBy?: string;
}

export class CampaignService {
  /**
   * Crea una campaña y envía las notificaciones push
   */
  async createCampaign(data: CreateCampaignDto): Promise<any> {
    // Crear la campaña en la base de datos
    const campaign = await prisma.campaign.create({
      data: {
        title: data.title,
        message: data.message,
        targetType: data.targetType,
        targetUserIds: data.targetUserIds && data.targetUserIds.length > 0 
          ? data.targetUserIds 
          : undefined,
        createdBy: data.createdBy,
      },
    });

    // Enviar notificaciones según el tipo de target
    let sentCount = 0;
    let userIdsToNotify: string[] = [];

    try {
      switch (data.targetType) {
        case 'all':
          // Obtener todos los usuarios que tienen tokens FCM
          const allTokens = await prisma.fcmToken.findMany({
            select: { userId: true },
            distinct: ['userId'],
          });
          userIdsToNotify = allTokens.map((t) => t.userId);
          break;

        case 'specific_users':
          if (!data.targetUserIds || data.targetUserIds.length === 0) {
            throw new Error('Target user IDs are required for specific_users');
          }
          userIdsToNotify = data.targetUserIds;
          break;

        case 'barbers_only':
          // Obtener usuarios que son barberos (tienen perfil de barbero)
          const barbers = await prisma.barber.findMany({
            select: { email: true },
          });
          const barberEmails = barbers.map((b) => b.email);
          const barberUsers = await prisma.user.findMany({
            where: { email: { in: barberEmails } },
            select: { id: true },
          });
          userIdsToNotify = barberUsers.map((u) => u.id);
          break;

        case 'clients_only':
          // Obtener usuarios que NO son barberos
          const allBarbers = await prisma.barber.findMany({
            select: { email: true },
          });
          const allBarberEmails = allBarbers.map((b) => b.email);
          const clientUsers = await prisma.user.findMany({
            where: { email: { notIn: allBarberEmails } },
            select: { id: true },
          });
          userIdsToNotify = clientUsers.map((u) => u.id);
          break;
      }

      // Filtrar solo usuarios que tienen tokens FCM
      const usersWithTokens = await prisma.fcmToken.findMany({
        where: { userId: { in: userIdsToNotify } },
        select: { userId: true },
        distinct: ['userId'],
      });
      const finalUserIds = usersWithTokens.map((t) => t.userId);

      if (finalUserIds.length > 0) {
        // Enviar notificaciones
        await notificationService.sendNotificationToUsers(finalUserIds, {
          title: data.title,
          body: data.message,
          data: {
            type: 'campaign',
            campaignId: campaign.id,
          },
        });

        sentCount = finalUserIds.length;
      }

      // Actualizar la campaña con la información de envío
      const updatedCampaign = await prisma.campaign.update({
        where: { id: campaign.id },
        data: {
          sentAt: new Date(),
          sentCount: sentCount,
        },
      });

      return updatedCampaign;
    } catch (error) {
      // Si falla el envío, actualizar la campaña con el error pero no fallar
      console.error('Error sending campaign notifications:', error);
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: {
          sentAt: new Date(),
          sentCount: 0,
        },
      });
      throw error;
    }
  }

  /**
   * Obtiene todas las campañas
   */
  async getCampaigns(): Promise<any[]> {
    return await prisma.campaign.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Obtiene una campaña por ID
   */
  async getCampaignById(id: string): Promise<any | null> {
    return await prisma.campaign.findUnique({
      where: { id },
    });
  }
}

export default new CampaignService();

