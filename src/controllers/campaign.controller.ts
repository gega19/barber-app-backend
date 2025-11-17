import { Request, Response } from 'express';
import campaignService from '../services/campaign.service';

export class CampaignController {
  /**
   * POST /api/campaigns
   * Crea una campaña y envía notificaciones push
   */
  async createCampaign(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { title, message, targetType, targetUserIds } = req.body;

      const campaign = await campaignService.createCampaign({
        title,
        message,
        targetType,
        targetUserIds: targetUserIds || undefined,
        createdBy: userId,
      });

      res.status(201).json({
        success: true,
        message: 'Campaign created and notifications sent successfully',
        data: campaign,
      });
    } catch (error) {
      console.error('Error creating campaign:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error creating campaign',
      });
    }
  }

  /**
   * GET /api/campaigns
   * Obtiene todas las campañas
   */
  async getCampaigns(req: Request, res: Response): Promise<void> {
    try {
      const campaigns = await campaignService.getCampaigns();

      res.status(200).json({
        success: true,
        data: campaigns,
      });
    } catch (error) {
      console.error('Error getting campaigns:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error getting campaigns',
      });
    }
  }

  /**
   * GET /api/campaigns/:id
   * Obtiene una campaña por ID
   */
  async getCampaignById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const campaign = await campaignService.getCampaignById(id);

      if (!campaign) {
        res.status(404).json({
          success: false,
          message: 'Campaign not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: campaign,
      });
    } catch (error) {
      console.error('Error getting campaign:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error getting campaign',
      });
    }
  }
}

export default new CampaignController();

