import { Router } from 'express';
import statsController from '../controllers/stats.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireBackofficeAccess } from '../middleware/role.middleware';

const router = Router();

// Solo usuarios ADMIN y CLIENT pueden acceder a las estadísticas del dashboard
router.get('/dashboard', authenticate, requireBackofficeAccess, statsController.getDashboardStats.bind(statsController));
router.get('/appointments-by-month', authenticate, requireBackofficeAccess, statsController.getAppointmentsByMonth.bind(statsController));
router.get('/revenue-by-month', authenticate, requireBackofficeAccess, statsController.getRevenueByMonth.bind(statsController));
router.get('/appointments-by-status', authenticate, requireBackofficeAccess, statsController.getAppointmentsByStatus.bind(statsController));

export default router;

