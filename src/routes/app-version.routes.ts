import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import appVersionController, { uploadApkMiddleware, handleApkUploadError } from '../controllers/app-version.controller';
import {
  createVersionValidator,
  updateVersionValidator,
  activateVersionValidator,
  deleteVersionValidator,
  getVersionValidator,
  downloadVersionValidator,
} from '../validators/app-version.validator';
import { handleValidationErrors } from '../middleware/validation.middleware';

const router = Router();

// Rutas públicas
router.get('/version', appVersionController.getActiveVersion.bind(appVersionController));
router.get(
  '/download/:versionId',
  downloadVersionValidator,
  handleValidationErrors,
  appVersionController.downloadApk.bind(appVersionController)
);

// Rutas admin (sin prefijo /admin porque ya está en el path base)
router.get(
  '/versions',
  authenticate,
  requireRole('ADMIN'),
  appVersionController.getAllVersions.bind(appVersionController)
);

router.get(
  '/versions/:id',
  authenticate,
  requireRole('ADMIN'),
  getVersionValidator,
  handleValidationErrors,
  appVersionController.getVersionById.bind(appVersionController)
);

router.post(
  '/versions',
  authenticate,
  requireRole('ADMIN'),
  uploadApkMiddleware,
  handleApkUploadError,
  createVersionValidator,
  handleValidationErrors,
  appVersionController.createVersion.bind(appVersionController)
);

router.put(
  '/versions/:id',
  authenticate,
  requireRole('ADMIN'),
  updateVersionValidator,
  handleValidationErrors,
  appVersionController.updateVersion.bind(appVersionController)
);

router.put(
  '/versions/:id/activate',
  authenticate,
  requireRole('ADMIN'),
  activateVersionValidator,
  handleValidationErrors,
  appVersionController.activateVersion.bind(appVersionController)
);

router.delete(
  '/versions/:id',
  authenticate,
  requireRole('ADMIN'),
  deleteVersionValidator,
  handleValidationErrors,
  appVersionController.deleteVersion.bind(appVersionController)
);

router.get(
  '/stats',
  authenticate,
  requireRole('ADMIN'),
  appVersionController.getDownloadStats.bind(appVersionController)
);

export default router;

