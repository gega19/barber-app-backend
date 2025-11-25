import { Request, Response } from 'express';
import workplaceService from '../services/workplace.service';

class WorkplaceController {
  async getAllWorkplaces(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string | undefined;

      const result = await workplaceService.getAllWorkplaces(page, limit, search);
      res.status(200).json({
        success: true,
        data: result.workplaces,
        pagination: result.pagination,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get workplaces';
      res.status(500).json({ success: false, message });
    }
  }

  async getWorkplaces(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      
      let workplaces;
      if (limit && limit > 0) {
        workplaces = await workplaceService.getTrendingWorkplaces(limit);
      } else {
        workplaces = await workplaceService.getWorkplaces();
      }
      
      res.status(200).json({
        success: true,
        data: workplaces,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get workplaces';
      res.status(500).json({ success: false, message });
    }
  }

  async getBestWorkplaces(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 5;
      const workplaces = await workplaceService.getBestWorkplaces(limit);
      
      res.status(200).json({
        success: true,
        data: workplaces,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get best workplaces';
      res.status(500).json({ success: false, message });
    }
  }

  async getWorkplaceById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const workplace = await workplaceService.getWorkplaceById(id);

      res.status(200).json({
        success: true,
        data: workplace,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get workplace';
      if (message === 'Workplace not found') {
        res.status(404).json({ success: false, message });
      } else {
        res.status(500).json({ success: false, message });
      }
    }
  }

  async createWorkplace(req: Request, res: Response): Promise<void> {
    try {
      const { 
        name, 
        address, 
        city, 
        latitude, 
        longitude, 
        description, 
        image, 
        banner,
        instagramUrl,
        tiktokUrl
      } = req.body;

      if (!name) {
        res.status(400).json({
          success: false,
          message: 'Name is required',
        });
        return;
      }

      // Parse coordinates if provided
      const parsedLatitude = latitude !== undefined ? parseFloat(latitude) : undefined;
      const parsedLongitude = longitude !== undefined ? parseFloat(longitude) : undefined;

      const workplace = await workplaceService.createWorkplace({
        name,
        address,
        city,
        latitude: parsedLatitude,
        longitude: parsedLongitude,
        description,
        image,
        banner,
        instagramUrl,
        tiktokUrl,
      });

      res.status(201).json({
        success: true,
        data: workplace,
        message: 'Workplace created successfully',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create workplace';
      if (message.includes('already exists')) {
        res.status(409).json({ success: false, message });
      } else if (message.includes('latitude') || message.includes('longitude') || message.includes('Both')) {
        res.status(400).json({ success: false, message });
      } else if (message.includes('Invalid Instagram') || message.includes('Invalid TikTok')) {
        res.status(400).json({ success: false, message });
      } else {
        res.status(500).json({ success: false, message });
      }
    }
  }

  async updateWorkplace(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { 
        name, 
        address, 
        city, 
        latitude, 
        longitude, 
        description, 
        image, 
        banner,
        instagramUrl,
        tiktokUrl
      } = req.body;

      // Parse coordinates if provided
      const parsedLatitude = latitude !== undefined ? parseFloat(latitude) : undefined;
      const parsedLongitude = longitude !== undefined ? parseFloat(longitude) : undefined;

      const workplace = await workplaceService.updateWorkplace(id, {
        name,
        address,
        city,
        latitude: parsedLatitude,
        longitude: parsedLongitude,
        description,
        image,
        banner,
        instagramUrl,
        tiktokUrl,
      });

      res.status(200).json({
        success: true,
        data: workplace,
        message: 'Workplace updated successfully',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update workplace';
      if (message === 'Workplace not found') {
        res.status(404).json({ success: false, message });
      } else if (message.includes('already exists')) {
        res.status(409).json({ success: false, message });
      } else if (message.includes('latitude') || message.includes('longitude') || message.includes('Both')) {
        res.status(400).json({ success: false, message });
      } else if (message.includes('Invalid Instagram') || message.includes('Invalid TikTok')) {
        res.status(400).json({ success: false, message });
      } else {
        res.status(500).json({ success: false, message });
      }
    }
  }

  async deleteWorkplace(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await workplaceService.deleteWorkplace(id);

      res.status(200).json({
        success: true,
        message: 'Workplace deleted successfully',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete workplace';
      if (message === 'Workplace not found') {
        res.status(404).json({ success: false, message });
      } else if (message.includes('associated barbers')) {
        res.status(400).json({ success: false, message });
      } else {
        res.status(500).json({ success: false, message });
      }
    }
  }

  async getNearbyWorkplaces(req: Request, res: Response): Promise<void> {
    try {
      const lat = parseFloat(req.query.lat as string);
      const lng = parseFloat(req.query.lng as string);
      const radius = req.query.radius ? parseFloat(req.query.radius as string) : 5;

      if (isNaN(lat) || isNaN(lng)) {
        res.status(400).json({
          success: false,
          message: 'Valid latitude and longitude are required',
        });
        return;
      }

      if (lat < -90 || lat > 90) {
        res.status(400).json({
          success: false,
          message: 'Latitude must be between -90 and 90',
        });
        return;
      }

      if (lng < -180 || lng > 180) {
        res.status(400).json({
          success: false,
          message: 'Longitude must be between -180 and 180',
        });
        return;
      }

      if (radius < 0 || radius > 100) {
        res.status(400).json({
          success: false,
          message: 'Radius must be between 0 and 100 kilometers',
        });
        return;
      }

      const workplaces = await workplaceService.getNearbyWorkplaces(lat, lng, radius);

      res.status(200).json({
        success: true,
        data: workplaces,
        message: `Found ${workplaces.length} workplace(s) within ${radius}km`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get nearby workplaces';
      res.status(500).json({ success: false, message });
    }
  }
}

export default new WorkplaceController();
