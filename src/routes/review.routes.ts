import { Router } from 'express';
import reviewController from '../controllers/review.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/barber/:barberId', reviewController.getReviewsByBarber.bind(reviewController));
router.get('/workplace/:workplaceId', reviewController.getReviewsByWorkplace.bind(reviewController));
router.post('/', authenticate, reviewController.createReview.bind(reviewController));
router.get('/check/barber/:barberId', authenticate, reviewController.hasUserReviewedBarber.bind(reviewController));
router.get('/check/workplace/:workplaceId', authenticate, reviewController.hasUserReviewedWorkplace.bind(reviewController));

export default router;

