import { Router } from 'express';
import barberAvailabilityController from '../controllers/barber-availability.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Obtener mi disponibilidad (requiere autenticación)
router.get('/me', authenticate, barberAvailabilityController.getMyAvailability.bind(barberAvailabilityController));

// Actualizar mi disponibilidad (requiere autenticación)
router.put('/me', authenticate, barberAvailabilityController.updateMyAvailability.bind(barberAvailabilityController));

// Obtener slots disponibles para un barbero en una fecha específica (público)
router.get('/:id/slots', barberAvailabilityController.getAvailableSlots.bind(barberAvailabilityController));

export default router;

