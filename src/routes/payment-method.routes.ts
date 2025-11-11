import { Router } from 'express';
import paymentMethodController from '../controllers/payment-method.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();

// Admin routes (must be before /:id to avoid route conflicts)
router.get('/admin', authenticate, requireRole('ADMIN'), paymentMethodController.getAllPaymentMethods.bind(paymentMethodController));
router.get('/admin/:id', authenticate, requireRole('ADMIN'), paymentMethodController.getPaymentMethodById.bind(paymentMethodController));
router.post('/admin', authenticate, requireRole('ADMIN'), paymentMethodController.createPaymentMethod.bind(paymentMethodController));
router.put('/admin/:id', authenticate, requireRole('ADMIN'), paymentMethodController.updatePaymentMethod.bind(paymentMethodController));
router.delete('/admin/:id', authenticate, requireRole('ADMIN'), paymentMethodController.deletePaymentMethod.bind(paymentMethodController));

// Public route to get payment method with config (for app)
router.get('/:id/config', paymentMethodController.getPaymentMethodById.bind(paymentMethodController));

// Public routes (must be after admin routes)
router.get('/', paymentMethodController.getActivePaymentMethods.bind(paymentMethodController));
router.get('/all', paymentMethodController.getAllPaymentMethods.bind(paymentMethodController));
router.get('/:id', paymentMethodController.getPaymentMethodById.bind(paymentMethodController));

export default router;

