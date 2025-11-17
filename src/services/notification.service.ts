import admin from 'firebase-admin';
import { isFirebaseInitialized, getFirebaseAdmin } from '../config/firebase-admin';
import fcmTokenService from './fcm-token.service';

export interface NotificationData {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

export class NotificationService {
  /**
   * Envía una notificación push a un usuario específico
   */
  async sendNotificationToUser(
    userId: string,
    notification: NotificationData
  ): Promise<void> {
    if (!isFirebaseInitialized()) {
      console.warn('⚠️  Firebase Admin not initialized. Skipping notification.');
      return;
    }

    try {
      const tokens = await fcmTokenService.getUserTokens(userId);
      
      if (tokens.length === 0) {
        console.log(`ℹ️  No FCM tokens found for user ${userId}`);
        return;
      }

      await this.sendNotificationToMultipleTokens(tokens, notification);
    } catch (error) {
      console.error(`Error sending notification to user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Envía una notificación push a múltiples usuarios
   */
  async sendNotificationToUsers(
    userIds: string[],
    notification: NotificationData
  ): Promise<void> {
    if (!isFirebaseInitialized()) {
      console.warn('⚠️  Firebase Admin not initialized. Skipping notification.');
      return;
    }

    try {
      const tokensMap = await fcmTokenService.getUsersTokens(userIds);
      const allTokens: string[] = [];
      
      tokensMap.forEach((tokens) => {
        allTokens.push(...tokens);
      });

      if (allTokens.length === 0) {
        console.log(`ℹ️  No FCM tokens found for users`);
        return;
      }

      await this.sendNotificationToMultipleTokens(allTokens, notification);
    } catch (error) {
      console.error('Error sending notification to users:', error);
      throw error;
    }
  }

  /**
   * Envía una notificación push a un token específico
   */
  async sendNotificationToToken(
    token: string,
    notification: NotificationData
  ): Promise<boolean> {
    if (!isFirebaseInitialized()) {
      console.warn('⚠️  Firebase Admin not initialized. Skipping notification.');
      return false;
    }

    try {
      const firebaseAdmin = getFirebaseAdmin();
      if (!firebaseAdmin) {
        return false;
      }

      const message: admin.messaging.Message = {
        token,
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: notification.data
          ? Object.fromEntries(
              Object.entries(notification.data).map(([key, value]) => [key, String(value)])
            )
          : undefined,
        android: {
          priority: 'high',
          notification: {
            channelId: 'appointments',
            sound: 'default',
            priority: 'high',
            ...(notification.imageUrl && { imageUrl: notification.imageUrl }),
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      const response = await admin.messaging().send(message);
      console.log(`✅ Notification sent successfully: ${response}`);
      return true;
    } catch (error: any) {
      // Si el token es inválido, eliminarlo de la base de datos
      if (error?.code === 'messaging/invalid-registration-token' || 
          error?.code === 'messaging/registration-token-not-registered') {
        console.log(`⚠️  Invalid token detected, removing from database: ${token}`);
        await fcmTokenService.deleteToken(token).catch((e) => {
          console.error('Error deleting invalid token:', e);
        });
      }
      console.error(`Error sending notification to token:`, error);
      return false;
    }
  }

  /**
   * Envía una notificación push a múltiples tokens
   * Maneja automáticamente tokens inválidos
   */
  async sendNotificationToMultipleTokens(
    tokens: string[],
    notification: NotificationData
  ): Promise<void> {
    if (!isFirebaseInitialized()) {
      console.warn('⚠️  Firebase Admin not initialized. Skipping notification.');
      return;
    }

    if (tokens.length === 0) {
      return;
    }

    try {
      const firebaseAdmin = getFirebaseAdmin();
      if (!firebaseAdmin) {
        return;
      }

      // Dividir en lotes de 500 (límite de FCM)
      const batchSize = 500;
      const batches: string[][] = [];
      
      for (let i = 0; i < tokens.length; i += batchSize) {
        batches.push(tokens.slice(i, i + batchSize));
      }

      for (const batch of batches) {
        const message: admin.messaging.MulticastMessage = {
          tokens: batch,
          notification: {
            title: notification.title,
            body: notification.body,
          },
          data: notification.data
            ? Object.fromEntries(
                Object.entries(notification.data).map(([key, value]) => [key, String(value)])
              )
            : undefined,
          android: {
            priority: 'high',
            notification: {
              channelId: 'appointments',
              sound: 'default',
              priority: 'high',
              ...(notification.imageUrl && { imageUrl: notification.imageUrl }),
            },
          },
          apns: {
            payload: {
              aps: {
                sound: 'default',
                badge: 1,
              },
            },
          },
        };

        const response = await admin.messaging().sendEachForMulticast(message);
        
        console.log(`✅ Sent ${response.successCount} notifications`);
        if (response.failureCount > 0) {
          console.warn(`⚠️  ${response.failureCount} notifications failed`);
        }

        // Eliminar tokens inválidos
        if (response.responses) {
          const invalidTokens: string[] = [];
          response.responses.forEach((resp, idx) => {
            if (!resp.success) {
              const error = resp.error;
              if (error?.code === 'messaging/invalid-registration-token' ||
                  error?.code === 'messaging/registration-token-not-registered') {
                invalidTokens.push(batch[idx]);
              }
            }
          });

          if (invalidTokens.length > 0) {
            console.log(`⚠️  Removing ${invalidTokens.length} invalid tokens`);
            await Promise.all(
              invalidTokens.map((token) =>
                fcmTokenService.deleteToken(token).catch((e) => {
                  console.error('Error deleting invalid token:', e);
                })
              )
            );
          }
        }
      }
    } catch (error) {
      console.error('Error sending notifications to multiple tokens:', error);
      throw error;
    }
  }
}

export default new NotificationService();

