import { Router, Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import campaignController from '../controllers/campaign.controller';
import { authenticate } from '../middleware/auth.middleware';
import { createCampaignValidator } from '../validators/campaign.validator';

const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
    return;
  }
  next();
};

const router = Router();

/**
 * @route   POST /api/campaigns
 * @desc    Crear una campaña y enviar notificaciones push
 * @access  Private
 */
router.post(
  '/',
  authenticate,
  createCampaignValidator,
  handleValidationErrors,
  campaignController.createCampaign.bind(campaignController)
);

/**
 * @route   GET /api/campaigns
 * @desc    Obtener todas las campañas
 * @access  Private
 */
router.get(
  '/',
  authenticate,
  campaignController.getCampaigns.bind(campaignController)
);

/**
 * @route   GET /api/campaigns/:id
 * @desc    Obtener una campaña por ID
 * @access  Private
 */
router.get(
  '/:id',
  authenticate,
  campaignController.getCampaignById.bind(campaignController)
);

export default router;

