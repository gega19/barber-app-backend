import { Router } from 'express';
import barberMediaController from '../controllers/barber-media.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/barber/:barberId', barberMediaController.getBarberMedia.bind(barberMediaController));
router.get('/:id', barberMediaController.getMediaById.bind(barberMediaController));
router.post('/barber/:barberId', authenticate, barberMediaController.createMedia.bind(barberMediaController));
router.post('/barber/:barberId/multiple', authenticate, barberMediaController.createMultipleMedia.bind(barberMediaController));
router.put('/:id', authenticate, barberMediaController.updateMedia.bind(barberMediaController));
router.delete('/:id', authenticate, barberMediaController.deleteMedia.bind(barberMediaController));

export default router;
