import { Request, Response } from 'express';
import workplaceMediaService from '../services/workplace-media.service';
import prisma from '../config/prisma';

class WorkplaceMediaController {
  async getWorkplaceMedia(req: Request, res: Response): Promise<void> {
    try {
      const { workplaceId } = req.params;
      const media = await workplaceMediaService.getWorkplaceMedia(workplaceId);
      res.status(200).json({
        success: true,
        data: media,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get workplace media';
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

      const { workplaceId } = req.params;
      const { type, url, thumbnail, caption } = req.body;

      if (!type || !url) {
        res.status(400).json({
          success: false,
          message: 'Type and URL are required',
        });
        return;
      }

      // Verify workplace exists
      const workplace = await prisma.workplace.findUnique({
        where: { id: workplaceId },
      });

      if (!workplace) {
        res.status(404).json({
          success: false,
          message: 'Workplace not found',
        });
        return;
      }

      const media = await workplaceMediaService.createMedia(workplaceId, {
        type,
        url,
        thumbnail,
        caption,
      });

      res.status(201).json({
        success: true,
        data: media,
        message: 'Media created successfully',
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

      const { workplaceId } = req.params;
      const { mediaItems } = req.body;

      if (!Array.isArray(mediaItems) || mediaItems.length === 0) {
        res.status(400).json({
          success: false,
          message: 'mediaItems must be a non-empty array',
        });
        return;
      }

      // Verify workplace exists
      const workplace = await prisma.workplace.findUnique({
        where: { id: workplaceId },
      });

      if (!workplace) {
        res.status(404).json({
          success: false,
          message: 'Workplace not found',
        });
        return;
      }

      const createdMedia = await workplaceMediaService.createMultipleMedia(workplaceId, mediaItems);

      res.status(201).json({
        success: true,
        data: createdMedia,
        message: 'Media created successfully',
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

      const media = await workplaceMediaService.updateMedia(id, {
        caption,
        thumbnail,
      });

      res.status(200).json({
        success: true,
        data: media,
        message: 'Media updated successfully',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update media';
      if (message.includes('not found')) {
        res.status(404).json({ success: false, message });
      } else {
        res.status(500).json({ success: false, message });
      }
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
      await workplaceMediaService.deleteMedia(id);

      res.status(200).json({
        success: true,
        message: 'Media deleted successfully',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete media';
      if (message.includes('not found')) {
        res.status(404).json({ success: false, message });
      } else {
        res.status(500).json({ success: false, message });
      }
    }
  }
}

export default new WorkplaceMediaController();


