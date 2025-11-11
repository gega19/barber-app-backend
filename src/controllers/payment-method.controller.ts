import { Request, Response } from 'express';
import paymentMethodService from '../services/payment-method.service';

class PaymentMethodController {
  async getActivePaymentMethods(req: Request, res: Response): Promise<void> {
    try {
      const paymentMethods = await paymentMethodService.getActivePaymentMethods();

      res.status(200).json({
        success: true,
        data: paymentMethods,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get payment methods';
      res.status(500).json({ success: false, message });
    }
  }

  async getAllPaymentMethods(req: Request, res: Response): Promise<void> {
    try {
      const paymentMethods = await paymentMethodService.getAllPaymentMethods();

      res.status(200).json({
        success: true,
        data: paymentMethods,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get payment methods';
      res.status(500).json({ success: false, message });
    }
  }

  async getPaymentMethodById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const paymentMethod = await paymentMethodService.getPaymentMethodById(id);

      if (!paymentMethod) {
        res.status(404).json({
          success: false,
          message: 'Payment method not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: paymentMethod,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get payment method';
      res.status(500).json({ success: false, message });
    }
  }

  async createPaymentMethod(req: Request, res: Response): Promise<void> {
    try {
      const { name, icon, type, config, isActive } = req.body;

      if (!name) {
        res.status(400).json({
          success: false,
          message: 'Name is required',
        });
        return;
      }

      const paymentMethod = await paymentMethodService.createPaymentMethod({
        name,
        icon,
        type,
        config,
        isActive,
      });

      res.status(201).json({
        success: true,
        data: paymentMethod,
        message: 'Método de pago creado exitosamente',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create payment method';
      if (message.includes('Unique constraint')) {
        res.status(409).json({ success: false, message: 'El nombre del método de pago ya existe' });
      } else {
        res.status(500).json({ success: false, message });
      }
    }
  }

  async updatePaymentMethod(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, icon, type, config, isActive } = req.body;

      const paymentMethod = await paymentMethodService.updatePaymentMethod(id, {
        name,
        icon,
        type,
        config,
        isActive,
      });

      res.status(200).json({
        success: true,
        data: paymentMethod,
        message: 'Método de pago actualizado exitosamente',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update payment method';
      if (message.includes('Unique constraint')) {
        res.status(409).json({ success: false, message: 'El nombre del método de pago ya existe' });
      } else {
        res.status(500).json({ success: false, message });
      }
    }
  }

  async deletePaymentMethod(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await paymentMethodService.deletePaymentMethod(id);

      res.status(200).json({
        success: true,
        message: 'Método de pago eliminado exitosamente',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete payment method';
      res.status(500).json({ success: false, message });
    }
  }
}

export default new PaymentMethodController();

