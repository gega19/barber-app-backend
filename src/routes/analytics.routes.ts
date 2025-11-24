import { Router } from 'express';
import analyticsController from '../controllers/analytics.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireBackofficeAccess } from '../middleware/role.middleware';

const router = Router();

// Endpoints públicos para tracking (no requieren autenticación)
router.post('/track', analyticsController.trackEvent.bind(analyticsController));
router.post('/track-batch', analyticsController.trackBatch.bind(analyticsController));

// Endpoints protegidos para consultar analytics (requieren autenticación y acceso al backoffice)
router.get('/events', authenticate, requireBackofficeAccess, analyticsController.getEvents.bind(analyticsController));
router.get('/stats', authenticate, requireBackofficeAccess, analyticsController.getStats.bind(analyticsController));

export default router;

