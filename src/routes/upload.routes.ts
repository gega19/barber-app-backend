import { Router } from 'express';
import uploadController, { uploadMiddleware, handleUploadError } from '../controllers/upload.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/', authenticate, uploadMiddleware, handleUploadError, uploadController.uploadFile.bind(uploadController));
router.delete('/', authenticate, uploadController.deleteFile.bind(uploadController));

export default router;
