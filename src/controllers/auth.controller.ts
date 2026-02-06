import { Request, Response } from 'express';
import authService, {
  LoginDto,
  RegisterDto,
  PhoneCodeCooldownError,
} from '../services/auth.service';

export class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const data: RegisterDto = req.body;
      
      const result = await authService.register(data);
      
      res.status(201).json({
        success: true,
        data: result,
        message: 'User registered successfully',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      res.status(400).json({
        success: false,
        message,
      });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const data: LoginDto = req.body;
      
      const result = await authService.login(data);
      
      res.status(200).json({
        success: true,
        data: result,
        message: 'Login successful',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      res.status(401).json({
        success: false,
        message,
      });
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const refreshToken = req.body.refreshToken || req.headers['x-refresh-token'];
      
      if (!userId || !refreshToken) {
        res.status(400).json({
          success: false,
          message: 'Invalid request',
        });
        return;
      }
      
      await authService.logout(userId, refreshToken as string);
      
      res.status(200).json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Logout failed';
      res.status(500).json({
        success: false,
        message,
      });
    }
  }

  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const refreshToken = req.body.refreshToken || req.headers['x-refresh-token'];
      
      if (!refreshToken) {
        res.status(400).json({
          success: false,
          message: 'Refresh token required',
        });
        return;
      }
      
      const accessToken = await authService.refreshAccessToken(refreshToken as string);
      
      res.status(200).json({
        success: true,
        data: { accessToken },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Token refresh failed';
      res.status(401).json({
        success: false,
        message,
      });
    }
  }

  async getCurrentUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }
      
      const user = await authService.getCurrentUser(userId);
      
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get user';
      res.status(500).json({
        success: false,
        message,
      });
    }
  }

  async getUserStats(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }
      
      const stats = await authService.getUserStats(userId);
      
      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get user stats';
      res.status(500).json({
        success: false,
        message,
      });
    }
  }

  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const { name, phone, location, country, gender, avatar, avatarSeed } = req.body;

      const updatedUser = await authService.updateProfile(userId, {
        name,
        phone,
        location,
        country,
        gender,
        avatar,
        avatarSeed,
      });
      
      res.status(200).json({
        success: true,
        data: updatedUser,
        message: 'Profile updated successfully',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update profile';
      res.status(500).json({ success: false, message });
    }
  }

  async becomeBarber(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

                      const { specialtyId, specialty, experienceYears, location, latitude, longitude, image, workplaceId, serviceType } = req.body;

          if (!specialty || !experienceYears || !location) {
            res.status(400).json({
              success: false,
              message: 'Missing required fields: specialty, experienceYears, location',
            });
            return;
          }

                    const result = await authService.becomeBarber(userId, {
              specialtyId,
              specialty,
              experienceYears: parseInt(experienceYears, 10),
              location,
              latitude: latitude ? parseFloat(latitude) : undefined,
              longitude: longitude ? parseFloat(longitude) : undefined,
              image,
              workplaceId,
              serviceType,
            });
        
        res.status(200).json({
          success: true,
          data: {
            user: result.user,
            barberId: result.barberId,
          },
          message: 'Successfully became a barber',
        });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to become barber';
      const statusCode = message.includes('already') ? 400 : 500;
      res.status(statusCode).json({ success: false, message });
          }
    }

  async deleteAccount(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const { password } = req.body;

      if (!password) {
        res.status(400).json({
          success: false,
          message: 'Password is required',
        });
        return;
      }

      await authService.deleteAccount(userId, password);

      res.status(200).json({
        success: true,
        message: 'Account deleted successfully',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete account';
      const statusCode = message.includes('incorrecta') ? 400 : (message.includes('Unauthorized') ? 401 : 500);
      res.status(statusCode).json({ success: false, message });
    }
  }

  async sendPhoneCode(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }
      const { phone } = req.body;
      if (!phone || typeof phone !== 'string') {
        res.status(400).json({ success: false, message: 'Phone is required' });
        return;
      }
      await authService.sendPhoneVerificationCode(userId, phone.trim());
      res.status(200).json({ success: true, message: 'Verification code sent' });
    } catch (error) {
      if (error instanceof PhoneCodeCooldownError) {
        res.status(429).json({
          success: false,
          message: error.message,
          retryAfterSeconds: error.retryAfterSeconds,
        });
        return;
      }
      const message = error instanceof Error ? error.message : 'Failed to send code';
      const isBusinessError =
        message.includes('already verified') ||
        message.includes('already in use') ||
        message.includes('not configured');
      res.status(isBusinessError ? 400 : 500).json({ success: false, message });
    }
  }

  async confirmPhone(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const { phone, code } = req.body;

      if (!phone || typeof phone !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Phone is required',
        });
        return;
      }
      if (!code || typeof code !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Verification code is required',
        });
        return;
      }

      await authService.confirmPhoneVerification(userId, phone.trim(), code.trim());
      const user = await authService.getCurrentUser(userId);
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }
      res.status(200).json({
        success: true,
        data: user,
        message: 'Phone verified successfully',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to verify phone';
      const isBusinessError =
        message.includes('already verified') ||
        message.includes('already in use') ||
        message.includes('Invalid or expired') ||
        message.includes('not configured');
      res.status(isBusinessError ? 400 : 500).json({ success: false, message });
    }
  }

  async updateBarberStep2(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const { workplaceId, serviceType } = req.body;

      await authService.updateBarberStep2(userId, {
        workplaceId,
        serviceType,
      });
      
      res.status(200).json({
        success: true,
        message: 'Barber profile updated successfully',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update barber profile';
      const statusCode = message.includes('not found') || message.includes('not a barber') ? 404 : 500;
      res.status(statusCode).json({ success: false, message });
    }
  }
  }
  
  export default new AuthController();

