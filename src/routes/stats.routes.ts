import { Router } from 'express';
import statsController from '../controllers/stats.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireBackofficeAccess } from '../middleware/role.middleware';

const router = Router();

// Solo usuarios ADMIN y CLIENT pueden acceder a las estadísticas del dashboard
router.get('/dashboard', authenticate, requireBackofficeAccess, statsController.getDashboardStats.bind(statsController));

export default router;

