import { Router } from 'express';
import workplaceMediaController from '../controllers/workplace-media.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();

// Public route for app to fetch workplace media
router.get('/workplace/:workplaceId', workplaceMediaController.getWorkplaceMedia.bind(workplaceMediaController));

// Protected routes (ADMIN only) for CRUD operations
router.post('/workplace/:workplaceId', authenticate, requireRole('ADMIN'), workplaceMediaController.createMedia.bind(workplaceMediaController));
router.post('/workplace/:workplaceId/multiple', authenticate, requireRole('ADMIN'), workplaceMediaController.createMultipleMedia.bind(workplaceMediaController));
router.put('/:id', authenticate, requireRole('ADMIN'), workplaceMediaController.updateMedia.bind(workplaceMediaController));
router.delete('/:id', authenticate, requireRole('ADMIN'), workplaceMediaController.deleteMedia.bind(workplaceMediaController));

export default router;

