import { Router } from 'express';
import barberController from '../controllers/barber.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();

router.get('/', barberController.getBarbers.bind(barberController));
router.get('/best', barberController.getBestBarbers.bind(barberController));
router.get('/search', barberController.searchBarbers.bind(barberController));
router.post('/admin/recompute-wall-scores', authenticate, requireRole('ADMIN'), barberController.recomputeWallScores.bind(barberController));
router.get('/favorites', authenticate, barberController.getFavorites.bind(barberController)); // Must be before /:id
router.get('/me', authenticate, barberController.getMe.bind(barberController)); // Must be before /:id
router.get('/slug/:slug', barberController.getBarberBySlug.bind(barberController)); // Must be before /:id
router.get('/workplace/:workplaceId', barberController.getBarbersByWorkplace.bind(barberController));
router.get('/:id', barberController.getBarberById.bind(barberController));
router.post('/:id/favorite', authenticate, barberController.toggleFavorite.bind(barberController));
router.put('/info', authenticate, barberController.updateBarberInfo.bind(barberController));

export default router;
