import { Request, Response } from 'express';
import serviceService from '../services/service.service';

class ServiceController {
  async getBarberServices(req: Request, res: Response): Promise<void> {
    try {
      const { barberId } = req.params;
      const services = await serviceService.getBarberServices(barberId);
      res.status(200).json({
        success: true,
        data: services,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get services';
      res.status(500).json({ success: false, message });
    }
  }

  async getServiceById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const service = await serviceService.getServiceById(id);
      
      if (!service) {
        res.status(404).json({
          success: false,
          message: 'Service not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: service,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get service';
      res.status(500).json({ success: false, message });
    }
  }

  async createService(req: Request, res: Response): Promise<void> {
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
      const { name, price, description, includes } = req.body;

      if (!name || !price) {
        res.status(400).json({
          success: false,
          message: 'Name and price are required',
        });
        return;
      }

      const service = await serviceService.createService(barberId, {
        name,
        price: parseFloat(price),
        description,
        includes,
      });

      res.status(201).json({
        success: true,
        data: service,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create service';
      res.status(500).json({ success: false, message });
    }
  }

  async createMultipleServices(req: Request, res: Response): Promise<void> {
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
      const { services } = req.body;

      if (!Array.isArray(services) || services.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Services array is required',
        });
        return;
      }

      const createdServices = await serviceService.createMultipleServices(barberId, services);

      res.status(201).json({
        success: true,
        data: createdServices,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create services';
      res.status(500).json({ success: false, message });
    }
  }

  async updateService(req: Request, res: Response): Promise<void> {
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
      const { name, price, description, includes } = req.body;

      const service = await serviceService.updateService(id, {
        name,
        price: price ? parseFloat(price) : undefined,
        description,
        includes,
      });

      res.status(200).json({
        success: true,
        data: service,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update service';
      res.status(500).json({ success: false, message });
    }
  }

  async deleteService(req: Request, res: Response): Promise<void> {
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
      await serviceService.deleteService(id);

      res.status(200).json({
        success: true,
        message: 'Service deleted successfully',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete service';
      res.status(500).json({ success: false, message });
    }
  }
}

export default new ServiceController();
