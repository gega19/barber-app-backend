import { Request, Response } from 'express';
import userService from '../services/user.service';

class UserController {
  async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string | undefined;

      const result = await userService.getAllUsers(page, limit, search);

      res.status(200).json({
        success: true,
        data: result.users,
        pagination: result.pagination,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get users';
      res.status(500).json({
        success: false,
        message,
      });
    }
  }

  async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = await userService.getUserById(id);

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get user';
      const statusCode = message === 'User not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message,
      });
    }
  }

  async createUser(req: Request, res: Response): Promise<void> {
    try {
      const data = req.body;
      const user = await userService.createUser(data);

      res.status(201).json({
        success: true,
        data: user,
        message: 'User created successfully',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create user';
      const statusCode = message.includes('already exists') ? 400 : 500;
      res.status(statusCode).json({
        success: false,
        message,
      });
    }
  }

  async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data = req.body;
      const user = await userService.updateUser(id, data);

      res.status(200).json({
        success: true,
        data: user,
        message: 'User updated successfully',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update user';
      const statusCode = message === 'User not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message,
      });
    }
  }

  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await userService.deleteUser(id);

      res.status(200).json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete user';
      const statusCode = message === 'User not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message,
      });
    }
  }
}

export default new UserController();

