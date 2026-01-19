import { Router } from 'express';
import myWorkplaceController from '../controllers/my-workplace.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();

// Todas las rutas de 'my-workplace' requieren estar autenticado
router.use(authenticate);

// Solo usuarios con rol BARBERSHOP o ADMIN pueden acceder
// (Un ADMIN también podría querer ver los detalles de una barbería simulando ser el manager)
router.use(requireRole('BARBERSHOP', 'ADMIN'));

router.get('/', myWorkplaceController.getMyWorkplace.bind(myWorkplaceController));
router.get('/barbers', myWorkplaceController.getBarbers.bind(myWorkplaceController));
router.get('/clients', myWorkplaceController.getClients.bind(myWorkplaceController));
router.get('/appointments', myWorkplaceController.getAppointments.bind(myWorkplaceController));
router.get('/stats', myWorkplaceController.getStats.bind(myWorkplaceController));

export default router;
