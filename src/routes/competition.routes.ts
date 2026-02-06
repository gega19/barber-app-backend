import { Router } from 'express';
import competitionController from '../controllers/competition.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();

// Public
router.get('/periods', competitionController.getPeriods.bind(competitionController));
router.get('/periods/current', competitionController.getCurrentPeriod.bind(competitionController));
router.get('/last-winner', competitionController.getLastWinner.bind(competitionController));
router.get('/barbers/:barberId/top-positions', competitionController.getBarberTopPositions.bind(competitionController));
router.get('/help-rules', competitionController.getHelpRules.bind(competitionController));
router.get('/periods/:periodId', competitionController.getPeriodById.bind(competitionController));
router.get('/periods/:periodId/leaderboard', competitionController.getLeaderboard.bind(competitionController));
router.get('/periods/:periodId/me', competitionController.getMe.bind(competitionController));

// Admin
router.post('/periods', authenticate, requireRole('ADMIN'), competitionController.createPeriod.bind(competitionController));
router.patch('/periods/:periodId', authenticate, requireRole('ADMIN'), competitionController.updatePeriod.bind(competitionController));
router.delete('/periods/:periodId', authenticate, requireRole('ADMIN'), competitionController.deletePeriod.bind(competitionController));
router.post('/periods/:periodId/recompute', authenticate, requireRole('ADMIN'), competitionController.recomputePeriod.bind(competitionController));
router.post('/periods/:periodId/close', authenticate, requireRole('ADMIN'), competitionController.closePeriod.bind(competitionController));
router.patch('/admin/help-rules', authenticate, requireRole('ADMIN'), competitionController.updateHelpRules.bind(competitionController));

export default router;
