import { Router } from 'express';
import barberDashboardController from '../controllers/barber-dashboard.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All dashboard routes require authentication
// The barberId is validated by the middleware chain

router.get(
  '/:barberId/daily',
  authenticate,
  barberDashboardController.getDailySummary.bind(barberDashboardController),
);

router.get(
  '/:barberId/monthly',
  authenticate,
  barberDashboardController.getMonthlySummary.bind(barberDashboardController),
);

router.get(
  '/:barberId/revenue-chart',
  authenticate,
  barberDashboardController.getRevenueChart.bind(barberDashboardController),
);

router.get(
  '/:barberId/top-services',
  authenticate,
  barberDashboardController.getTopServices.bind(barberDashboardController),
);

router.get(
  '/:barberId/clients',
  authenticate,
  barberDashboardController.getClientStats.bind(barberDashboardController),
);

router.get(
  '/:barberId/promotions',
  authenticate,
  barberDashboardController.getPromotionStats.bind(barberDashboardController),
);

router.get(
  '/:barberId/profile-views',
  authenticate,
  barberDashboardController.getProfileViews.bind(barberDashboardController),
);

router.get(
  '/:barberId/peak-hours',
  authenticate,
  barberDashboardController.getPeakHours.bind(barberDashboardController),
);

router.get(
  '/:barberId/rating-trend',
  authenticate,
  barberDashboardController.getRatingTrend.bind(barberDashboardController),
);

router.get(
  '/:barberId/payment-methods',
  authenticate,
  barberDashboardController.getRevenueByPaymentMethod.bind(barberDashboardController),
);

router.get(
  '/:barberId/reviews/distribution',
  authenticate,
  barberDashboardController.getReviewDistribution.bind(barberDashboardController),
);

router.get(
  '/:barberId/revenue-by-weekday',
  authenticate,
  barberDashboardController.getRevenueByDayOfWeek.bind(barberDashboardController),
);

export default router;
