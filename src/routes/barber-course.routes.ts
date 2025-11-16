import { Router } from 'express';
import { validationResult } from 'express-validator';
import barberCourseController from '../controllers/barber-course.controller';
import { authenticate } from '../middleware/auth.middleware';
import {
  createCourseValidator,
  updateCourseValidator,
  createCourseMediaValidator,
  updateCourseMediaValidator,
} from '../validators/barber-course.validator';

const router = Router();

// Middleware para manejar errores de validación
const handleValidationErrors = (req: any, res: any, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }
  next();
};

// Rutas para cursos
router.get('/barber/:barberId', barberCourseController.getBarberCourses.bind(barberCourseController));
router.post(
  '/barber/:barberId',
  authenticate,
  createCourseValidator,
  handleValidationErrors,
  barberCourseController.createCourse.bind(barberCourseController)
);
router.get('/course/:id', barberCourseController.getCourseById.bind(barberCourseController));
router.put(
  '/course/:id',
  authenticate,
  updateCourseValidator,
  handleValidationErrors,
  barberCourseController.updateCourse.bind(barberCourseController)
);
router.delete('/course/:id', authenticate, barberCourseController.deleteCourse.bind(barberCourseController));

// Rutas para media de cursos
router.get('/course/:courseId/media', barberCourseController.getCourseMedia.bind(barberCourseController));
router.post(
  '/course/:courseId/media',
  authenticate,
  createCourseMediaValidator,
  handleValidationErrors,
  barberCourseController.createCourseMedia.bind(barberCourseController)
);
router.post(
  '/course/:courseId/media/multiple',
  authenticate,
  barberCourseController.createMultipleCourseMedia.bind(barberCourseController)
);
router.put(
  '/media/:id',
  authenticate,
  updateCourseMediaValidator,
  handleValidationErrors,
  barberCourseController.updateCourseMedia.bind(barberCourseController)
);
router.delete('/media/:id', authenticate, barberCourseController.deleteCourseMedia.bind(barberCourseController));
router.get('/media/:id', barberCourseController.getCourseMediaById.bind(barberCourseController));

export default router;

