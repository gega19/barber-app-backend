import { Router } from 'express';
import promotionController from '../controllers/promotion.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();

// Admin routes (must be before /:id to avoid route conflicts)
router.get('/admin', authenticate, requireRole('ADMIN'), promotionController.getAllPromotions.bind(promotionController));
router.get('/admin/:id', authenticate, requireRole('ADMIN'), promotionController.getPromotionById.bind(promotionController));
router.post('/admin', authenticate, requireRole('ADMIN'), promotionController.createPromotion.bind(promotionController));
router.put('/admin/:id', authenticate, requireRole('ADMIN'), promotionController.updatePromotion.bind(promotionController));
router.delete('/admin/:id', authenticate, requireRole('ADMIN'), promotionController.deletePromotion.bind(promotionController));

// Public routes (must be after admin routes)
router.get('/', promotionController.getActivePromotions.bind(promotionController));
router.get('/:id', promotionController.getPromotionById.bind(promotionController));

export default router;

