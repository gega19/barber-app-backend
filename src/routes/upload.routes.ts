import { Router } from 'express';
import uploadController, { uploadMiddleware } from '../controllers/upload.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/', authenticate, uploadMiddleware, uploadController.uploadFile.bind(uploadController));

export default router;
