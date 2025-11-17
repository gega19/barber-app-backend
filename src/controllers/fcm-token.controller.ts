import { Request, Response } from 'express';
import fcmTokenService from '../services/fcm-token.service';

export class FcmTokenController {
  /**
   * POST /api/fcm-tokens
   * Registra o actualiza un token FCM para el usuario autenticado
   */
  async registerToken(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const { token, deviceType } = req.body;

      await fcmTokenService.registerToken(userId, { token, deviceType });

      res.status(200).json({
        success: true,
        message: 'Token registered successfully',
      });
    } catch (error) {
      console.error('Error registering FCM token:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error registering token',
      });
    }
  }

  /**
   * DELETE /api/fcm-tokens/:token
   * Elimina un token FCM específico
   */
  async deleteToken(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const { token } = req.params;

      // Verificar que el token pertenece al usuario
      const userTokens = await fcmTokenService.getUserTokens(userId);
      if (!userTokens.includes(token)) {
        res.status(403).json({
          success: false,
          message: 'Token does not belong to this user',
        });
        return;
      }

      await fcmTokenService.deleteToken(token);

      res.status(200).json({
        success: true,
        message: 'Token deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting FCM token:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error deleting token',
      });
    }
  }

  /**
   * DELETE /api/fcm-tokens
   * Elimina todos los tokens FCM del usuario autenticado
   */
  async deleteUserTokens(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      await fcmTokenService.deleteUserTokens(userId);

      res.status(200).json({
        success: true,
        message: 'All tokens deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting user FCM tokens:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error deleting tokens',
      });
    }
  }
}

export default new FcmTokenController();

