import prisma from '../config/prisma';

export interface RegisterTokenDto {
  token: string;
  deviceType: 'android' | 'ios';
}

export class FcmTokenService {
  /**
   * Registra o actualiza un token FCM para un usuario
   * Si el token ya existe, actualiza el deviceType y updatedAt
   */
  async registerToken(userId: string, data: RegisterTokenDto): Promise<void> {
    await prisma.fcmToken.upsert({
      where: { token: data.token },
      update: {
        deviceType: data.deviceType,
        updatedAt: new Date(),
        // Si el token cambió de usuario, actualizar el userId
        userId: userId,
      },
      create: {
        token: data.token,
        userId: userId,
        deviceType: data.deviceType,
      },
    });
  }

  /**
   * Elimina un token FCM específico
   */
  async deleteToken(token: string): Promise<void> {
    await prisma.fcmToken.deleteMany({
      where: { token },
    });
  }

  /**
   * Elimina todos los tokens FCM de un usuario
   */
  async deleteUserTokens(userId: string): Promise<void> {
    await prisma.fcmToken.deleteMany({
      where: { userId },
    });
  }

  /**
   * Obtiene todos los tokens FCM de un usuario
   */
  async getUserTokens(userId: string): Promise<string[]> {
    const tokens = await prisma.fcmToken.findMany({
      where: { userId },
      select: { token: true },
    });
    return tokens.map((t) => t.token);
  }

  /**
   * Obtiene todos los tokens FCM de múltiples usuarios
   */
  async getUsersTokens(userIds: string[]): Promise<Map<string, string[]>> {
    const tokens = await prisma.fcmToken.findMany({
      where: { userId: { in: userIds } },
      select: { token: true, userId: true },
    });

    const tokensMap = new Map<string, string[]>();
    for (const token of tokens) {
      const existing = tokensMap.get(token.userId) || [];
      existing.push(token.token);
      tokensMap.set(token.userId, existing);
    }

    return tokensMap;
  }
}

export default new FcmTokenService();

