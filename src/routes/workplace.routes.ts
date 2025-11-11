import { Router } from 'express';
import workplaceController from '../controllers/workplace.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();

// Public routes
router.get('/public', workplaceController.getWorkplaces.bind(workplaceController));
router.get('/public/:id', workplaceController.getWorkplaceById.bind(workplaceController));

// Protected routes (ADMIN only)
router.get('/', authenticate, requireRole('ADMIN'), workplaceController.getAllWorkplaces.bind(workplaceController));
router.get('/:id', authenticate, requireRole('ADMIN'), workplaceController.getWorkplaceById.bind(workplaceController));
router.post('/', authenticate, requireRole('ADMIN'), workplaceController.createWorkplace.bind(workplaceController));
router.put('/:id', authenticate, requireRole('ADMIN'), workplaceController.updateWorkplace.bind(workplaceController));
router.delete('/:id', authenticate, requireRole('ADMIN'), workplaceController.deleteWorkplace.bind(workplaceController));

export default router;
