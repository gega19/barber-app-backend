import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import legalDocumentController from '../controllers/legal-document.controller';
import {
  createDocumentValidator,
  updateDocumentValidator,
  getDocumentValidator,
  activateDocumentValidator,
  deleteDocumentValidator,
} from '../validators/legal-document.validator';
import { handleValidationErrors } from '../middleware/validation.middleware';

const router = Router();

// Rutas admin (deben ir antes de las públicas para evitar conflictos)
router.get(
  '/admin/documents',
  authenticate,
  requireRole('ADMIN'),
  legalDocumentController.getAllDocuments.bind(legalDocumentController)
);

router.get(
  '/admin/documents/id/:id',
  authenticate,
  requireRole('ADMIN'),
  legalDocumentController.getDocumentById.bind(legalDocumentController)
);

router.get(
  '/admin/documents/:type',
  authenticate,
  requireRole('ADMIN'),
  getDocumentValidator,
  handleValidationErrors,
  legalDocumentController.getDocumentsByType.bind(legalDocumentController)
);

router.post(
  '/admin/documents',
  authenticate,
  requireRole('ADMIN'),
  createDocumentValidator,
  handleValidationErrors,
  legalDocumentController.createDocument.bind(legalDocumentController)
);

router.put(
  '/admin/documents/:id',
  authenticate,
  requireRole('ADMIN'),
  updateDocumentValidator,
  handleValidationErrors,
  legalDocumentController.updateDocument.bind(legalDocumentController)
);

router.put(
  '/admin/documents/:id/activate',
  authenticate,
  requireRole('ADMIN'),
  activateDocumentValidator,
  handleValidationErrors,
  legalDocumentController.activateDocument.bind(legalDocumentController)
);

router.delete(
  '/admin/documents/:id',
  authenticate,
  requireRole('ADMIN'),
  deleteDocumentValidator,
  handleValidationErrors,
  legalDocumentController.deleteDocument.bind(legalDocumentController)
);

// Rutas públicas (deben ir al final para evitar conflictos con /admin)
router.get(
  '/:type',
  getDocumentValidator,
  handleValidationErrors,
  legalDocumentController.getActiveDocument.bind(legalDocumentController)
);

export default router;

