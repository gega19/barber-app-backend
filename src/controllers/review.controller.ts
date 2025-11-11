import { Request, Response } from 'express';
import reviewService from '../services/review.service';

class ReviewController {
  async getReviewsByBarber(req: Request, res: Response): Promise<void> {
    try {
      const { barberId } = req.params;
      const reviews = await reviewService.getReviewsByBarberId(barberId);

      res.status(200).json({
        success: true,
        data: reviews,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get reviews';
      res.status(500).json({ success: false, message });
    }
  }

  async getReviewsByWorkplace(req: Request, res: Response): Promise<void> {
    try {
      const { workplaceId } = req.params;
      const reviews = await reviewService.getReviewsByWorkplaceId(workplaceId);

      res.status(200).json({
        success: true,
        data: reviews,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get reviews';
      res.status(500).json({ success: false, message });
    }
  }

  async createReview(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { barberId, workplaceId, rating, comment } = req.body;

      if (!barberId && !workplaceId) {
        res.status(400).json({
          success: false,
          message: 'Either barberId or workplaceId is required',
        });
        return;
      }

      if (rating < 1 || rating > 5) {
        res.status(400).json({
          success: false,
          message: 'Rating must be between 1 and 5',
        });
        return;
      }

      const review = await reviewService.createReview({
        userId,
        barberId,
        workplaceId,
        rating,
        comment,
      });

      res.status(201).json({
        success: true,
        data: review,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create review';
      
      // Manejar errores específicos
      if (message.includes('No puedes dejar') || message.includes('Ya has dejado')) {
        res.status(400).json({ success: false, message });
      } else {
        res.status(500).json({ success: false, message });
      }
    }
  }

  async hasUserReviewedBarber(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { barberId } = req.params;
      const hasReviewed = await reviewService.hasUserReviewedBarber(userId, barberId);

      res.status(200).json({
        success: true,
        data: { hasReviewed },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to check review';
      res.status(500).json({ success: false, message });
    }
  }

  async hasUserReviewedWorkplace(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { workplaceId } = req.params;
      const hasReviewed = await reviewService.hasUserReviewedWorkplace(userId, workplaceId);

      res.status(200).json({
        success: true,
        data: { hasReviewed },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to check review';
      res.status(500).json({ success: false, message });
    }
  }
}

export default new ReviewController();

