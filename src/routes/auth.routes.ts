import { Router } from 'express';
import { validationResult } from 'express-validator';
import authController from '../controllers/auth.controller';
import {
  registerValidator,
  loginValidator,
  refreshTokenValidator,
  sendPhoneCodeValidator,
  confirmPhoneWithCodeValidator,
} from '../validators/auth.validator';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Validation middleware
const validate = (validations: any[]) => {
  return async (req: any, res: any, next: any) => {
    for (const validation of validations) {
      await validation.run(req);
    }
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }
    
    next();
  };
};

// Public routes
router.post('/register', validate(registerValidator), authController.register.bind(authController));
router.post('/login', validate(loginValidator), authController.login.bind(authController));
router.post('/refresh-token', validate(refreshTokenValidator), authController.refreshToken.bind(authController));

// Protected routes
router.post('/logout', authenticate, authController.logout.bind(authController));
router.get('/me', authenticate, authController.getCurrentUser.bind(authController));
router.get('/stats', authenticate, authController.getUserStats.bind(authController));
router.put('/profile', authenticate, authController.updateProfile.bind(authController));
router.post('/send-phone-code', authenticate, validate(sendPhoneCodeValidator), authController.sendPhoneCode.bind(authController));
router.post('/confirm-phone', authenticate, validate(confirmPhoneWithCodeValidator), authController.confirmPhone.bind(authController));
router.delete('/delete-account', authenticate, authController.deleteAccount.bind(authController));
router.post('/become-barber', authenticate, authController.becomeBarber.bind(authController));
router.put('/become-barber/step2', authenticate, authController.updateBarberStep2.bind(authController));

export default router;

