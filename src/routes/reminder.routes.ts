import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import reminderScheduler from '../services/reminder.scheduler';

const router = Router();

// Endpoint de prueba (solo Admin) para el Backoffice
router.post('/admin/reminders/test', authenticate, requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { appointmentId } = req.body;
    
    if (!appointmentId) {
      res.status(400).json({ success: false, message: 'appointmentId is required' });
      return;
    }

    await reminderScheduler.sendTestReminder(appointmentId);
    
    res.status(200).json({
      success: true,
      message: 'Test reminder sent successfully',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send test reminder';
    res.status(500).json({ success: false, message });
  }
});

export default router;
