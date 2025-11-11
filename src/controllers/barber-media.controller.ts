import { Request, Response } from 'express';
import barberMediaService from '../services/barber-media.service';

class BarberMediaController {
  async getBarberMedia(req: Request, res: Response): Promise<void> {
    try {
      const { barberId } = req.params;
      const media = await barberMediaService.getBarberMedia(barberId);
      res.status(200).json({
        success: true,
        data: media,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get media';
      res.status(500).json({ success: false, message });
    }
  }

  async createMedia(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const { barberId } = req.params;
      const { type, url, thumbnail, caption } = req.body;

      if (!type || !url) {
        res.status(400).json({
          success: false,
          message: 'Type and URL are required',
        });
        return;
      }

      const media = await barberMediaService.createMedia(barberId, {
        type,
        url,
        thumbnail,
        caption,
      });

      res.status(201).json({
        success: true,
        data: media,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create media';
      res.status(500).json({ success: false, message });
    }
  }

  async createMultipleMedia(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const { barberId } = req.params;
      const { media } = req.body;

      if (!Array.isArray(media) || media.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Media array is required',
        });
        return;
      }

      const createdMedia = await barberMediaService.createMultipleMedia(barberId, media);

      res.status(201).json({
        success: true,
        data: createdMedia,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create media';
      res.status(500).json({ success: false, message });
    }
  }

  async updateMedia(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const { id } = req.params;
      const { caption, thumbnail } = req.body;

      const media = await barberMediaService.updateMedia(id, {
        caption,
        thumbnail,
      });

      res.status(200).json({
        success: true,
        data: media,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update media';
      res.status(500).json({ success: false, message });
    }
  }

  async deleteMedia(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const { id } = req.params;
      await barberMediaService.deleteMedia(id);

      res.status(200).json({
        success: true,
        message: 'Media deleted successfully',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete media';
      res.status(500).json({ success: false, message });
    }
  }

  async getMediaById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const media = await barberMediaService.getMediaById(id);

      if (!media) {
        res.status(404).json({
          success: false,
          message: 'Media not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: media,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get media';
      res.status(500).json({ success: false, message });
    }
  }
}

export default new BarberMediaController();
