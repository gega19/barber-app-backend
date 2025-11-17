import { Router, Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import fcmTokenController from '../controllers/fcm-token.controller';
import { authenticate } from '../middleware/auth.middleware';
import {
  registerTokenValidator,
  deleteTokenValidator,
} from '../validators/fcm-token.validator';

const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }
  next();
};

const router = Router();

/**
 * @route   POST /api/fcm-tokens
 * @desc    Registrar o actualizar un token FCM
 * @access  Private
 */
router.post(
  '/',
  authenticate,
  registerTokenValidator,
  handleValidationErrors,
  fcmTokenController.registerToken.bind(fcmTokenController)
);

/**
 * @route   DELETE /api/fcm-tokens/:token
 * @desc    Eliminar un token FCM específico
 * @access  Private
 */
router.delete(
  '/:token',
  authenticate,
  deleteTokenValidator,
  handleValidationErrors,
  fcmTokenController.deleteToken.bind(fcmTokenController)
);

/**
 * @route   DELETE /api/fcm-tokens
 * @desc    Eliminar todos los tokens FCM del usuario autenticado
 * @access  Private
 */
router.delete(
  '/',
  authenticate,
  fcmTokenController.deleteUserTokens.bind(fcmTokenController)
);

export default router;

