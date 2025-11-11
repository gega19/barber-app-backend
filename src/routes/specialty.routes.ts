import { Router } from 'express';
import specialtyController from '../controllers/specialty.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();

// Public routes (for Flutter app)
router.get('/', specialtyController.getSpecialties.bind(specialtyController));

// Admin routes (must be before /:id to avoid route conflicts)
router.post('/admin', authenticate, requireRole('ADMIN'), specialtyController.createSpecialty.bind(specialtyController));
router.put('/admin/:id', authenticate, requireRole('ADMIN'), specialtyController.updateSpecialty.bind(specialtyController));
router.delete('/admin/:id', authenticate, requireRole('ADMIN'), specialtyController.deleteSpecialty.bind(specialtyController));

// Public routes (must be after admin routes)
router.get('/:id', specialtyController.getSpecialtyById.bind(specialtyController));

export default router;
