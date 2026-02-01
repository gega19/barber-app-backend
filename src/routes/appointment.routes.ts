import { Router } from 'express';
import appointmentController from '../controllers/appointment.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();

// Public routes (authenticated users)
router.get('/', authenticate, appointmentController.getMyAppointments.bind(appointmentController));
router.post('/', authenticate, appointmentController.createAppointment.bind(appointmentController));
router.get('/barber/:barberId/queue', authenticate, appointmentController.getBarberQueue.bind(appointmentController));
router.get('/:id', authenticate, appointmentController.getAppointmentById.bind(appointmentController));
router.put('/:id/cancel', authenticate, appointmentController.cancelAppointment.bind(appointmentController));
router.put('/:id/attend', authenticate, appointmentController.markAsAttended.bind(appointmentController));

// Admin routes
router.get('/admin', authenticate, requireRole('ADMIN'), appointmentController.getAllAppointments.bind(appointmentController));
router.get('/admin/pending-payments', authenticate, requireRole('ADMIN'), appointmentController.getPendingPaymentAppointments.bind(appointmentController));
router.get('/admin/:id', authenticate, requireRole('ADMIN'), appointmentController.getAppointmentById.bind(appointmentController));
router.put('/admin/:id', authenticate, requireRole('ADMIN'), appointmentController.updateAppointment.bind(appointmentController));
router.put('/admin/:id/verify-payment', authenticate, requireRole('ADMIN'), appointmentController.verifyPayment.bind(appointmentController));
router.delete('/admin/:id', authenticate, requireRole('ADMIN'), appointmentController.deleteAppointment.bind(appointmentController));

export default router;
