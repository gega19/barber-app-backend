import { Request, Response } from 'express';
import promotionService from '../services/promotion.service';

class PromotionController {
  async getActivePromotions(req: Request, res: Response): Promise<void> {
    try {
      const promotions = await promotionService.getActivePromotions();
      res.status(200).json({
        success: true,
        data: promotions,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get promotions';
      res.status(500).json({ success: false, message });
    }
  }

  async getActivePromotionsByBarber(req: Request, res: Response): Promise<void> {
    try {
      const { barberId } = req.params;
      if (!barberId) {
        res.status(400).json({
          success: false,
          message: 'barberId is required',
        });
        return;
      }

      const promotions = await promotionService.getActivePromotionsByBarber(barberId);
      res.status(200).json({
        success: true,
        data: promotions,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get promotions by barber';
      res.status(500).json({ success: false, message });
    }
  }

  async getPromotionById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const promotion = await promotionService.getPromotionById(id);

      if (!promotion) {
        res.status(404).json({
          success: false,
          message: 'Promotion not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: promotion,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get promotion';
      res.status(500).json({ success: false, message });
    }
  }

  async getAllPromotions(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string | undefined;
      const isActive = req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined;

      const result = await promotionService.getAllPromotions(page, limit, search, isActive);

      res.status(200).json({
        success: true,
        data: result.promotions,
        pagination: result.pagination,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get promotions';
      res.status(500).json({ success: false, message });
    }
  }

  async createPromotion(req: Request, res: Response): Promise<void> {
    try {
      const { title, description, code, discount, discountAmount, validFrom, validUntil, isActive, image, barberId } = req.body;

      if (!title || !description || !code || !validFrom || !validUntil) {
        res.status(400).json({
          success: false,
          message: 'Faltan campos requeridos: title, description, code, validFrom, validUntil',
        });
        return;
      }

      const promotion = await promotionService.createPromotion({
        title,
        description,
        code,
        discount: discount ? parseFloat(discount) : undefined,
        discountAmount: discountAmount ? parseFloat(discountAmount) : undefined,
        validFrom: new Date(validFrom),
        validUntil: new Date(validUntil),
        isActive: isActive !== undefined ? isActive : true,
        image,
        barberId: barberId || undefined,
      });

      res.status(201).json({
        success: true,
        data: promotion,
        message: 'Promoción creada exitosamente',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create promotion';
      if (message.includes('ya existe')) {
        res.status(409).json({ success: false, message });
      } else {
        res.status(500).json({ success: false, message });
      }
    }
  }

  async updatePromotion(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { title, description, code, discount, discountAmount, validFrom, validUntil, isActive, image, barberId } = req.body;

      const promotion = await promotionService.updatePromotion(id, {
        title,
        description,
        code,
        discount: discount !== undefined ? parseFloat(discount) : undefined,
        discountAmount: discountAmount !== undefined ? parseFloat(discountAmount) : undefined,
        validFrom: validFrom ? new Date(validFrom) : undefined,
        validUntil: validUntil ? new Date(validUntil) : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
        image,
        barberId: barberId !== undefined ? barberId : undefined,
      });

      res.status(200).json({
        success: true,
        data: promotion,
        message: 'Promoción actualizada exitosamente',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update promotion';
      if (message.includes('ya existe')) {
        res.status(409).json({ success: false, message });
      } else {
        res.status(500).json({ success: false, message });
      }
    }
  }

  async deletePromotion(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await promotionService.deletePromotion(id);

      res.status(200).json({
        success: true,
        message: 'Promoción eliminada exitosamente',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete promotion';
      res.status(500).json({ success: false, message });
    }
  }
}

export default new PromotionController();

