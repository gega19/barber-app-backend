import { Router } from 'express';
import serviceController from '../controllers/service.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/barber/:barberId', serviceController.getBarberServices.bind(serviceController));
router.get('/:id', serviceController.getServiceById.bind(serviceController));
router.post('/barber/:barberId', authenticate, serviceController.createService.bind(serviceController));
router.post('/barber/:barberId/multiple', authenticate, serviceController.createMultipleServices.bind(serviceController));
router.put('/:id', authenticate, serviceController.updateService.bind(serviceController));
router.delete('/:id', authenticate, serviceController.deleteService.bind(serviceController));

export default router;
