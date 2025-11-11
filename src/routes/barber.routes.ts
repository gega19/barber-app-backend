import { Router } from 'express';
import barberController from '../controllers/barber.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/', barberController.getBarbers.bind(barberController));
router.get('/best', barberController.getBestBarbers.bind(barberController));
router.get('/search', barberController.searchBarbers.bind(barberController));
router.get('/:id', barberController.getBarberById.bind(barberController));
router.put('/info', authenticate, barberController.updateBarberInfo.bind(barberController));

export default router;
