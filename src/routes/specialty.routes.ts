import { Router } from 'express';
import specialtyController from '../controllers/specialty.controller';

const router = Router();

router.get('/', specialtyController.getSpecialties.bind(specialtyController));
router.get('/:id', specialtyController.getSpecialtyById.bind(specialtyController));

export default router;
