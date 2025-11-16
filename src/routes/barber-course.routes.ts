import { Router } from 'express';
import barberCourseController from '../controllers/barber-course.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Rutas para cursos
router.get('/barber/:barberId', barberCourseController.getBarberCourses.bind(barberCourseController));
router.post('/barber/:barberId', authenticate, barberCourseController.createCourse.bind(barberCourseController));
router.get('/course/:id', barberCourseController.getCourseById.bind(barberCourseController));
router.put('/course/:id', authenticate, barberCourseController.updateCourse.bind(barberCourseController));
router.delete('/course/:id', authenticate, barberCourseController.deleteCourse.bind(barberCourseController));

// Rutas para media de cursos
router.get('/course/:courseId/media', barberCourseController.getCourseMedia.bind(barberCourseController));
router.post('/course/:courseId/media', authenticate, barberCourseController.createCourseMedia.bind(barberCourseController));
router.post('/course/:courseId/media/multiple', authenticate, barberCourseController.createMultipleCourseMedia.bind(barberCourseController));
router.put('/media/:id', authenticate, barberCourseController.updateCourseMedia.bind(barberCourseController));
router.delete('/media/:id', authenticate, barberCourseController.deleteCourseMedia.bind(barberCourseController));
router.get('/media/:id', barberCourseController.getCourseMediaById.bind(barberCourseController));

export default router;

