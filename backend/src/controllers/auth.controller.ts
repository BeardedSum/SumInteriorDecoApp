import { Request, Response } from 'express';
import AuthService from '../services/auth.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';

export class AuthController {
  async signup(req: Request, res: Response) {
    try {
      const { email, phone_number, full_name, password } = req.body;

      if (!full_name) {
        throw new AppError('Full name is required', 400);
      }

      if (!email && !phone_number) {
        throw new AppError('Either email or phone number is required', 400);
      }

      const result = await AuthService.signup({
        email,
        phone_number,
        full_name,
        password,
      });

      res.status(201).json({
        success: true,
        data: {
          user: {
            id: result.user.id,
            email: result.user.email,
            phone_number: result.user.phone_number,
            full_name: result.user.full_name,
            credits_balance: result.user.credits_balance,
            user_type: result.user.user_type,
          },
          tokens: result.tokens,
        },
      });
    } catch (error: any) {
      throw new AppError(error.message, 400);
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, phone_number, password } = req.body;
      const ip = req.ip || req.connection.remoteAddress || '';

      if (!password) {
        throw new AppError('Password is required', 400);
      }

      if (!email && !phone_number) {
        throw new AppError('Either email or phone number is required', 400);
      }

      const result = await AuthService.login(
        { email, phone_number, password },
        ip
      );

      res.json({
        success: true,
        data: {
          user: {
            id: result.user.id,
            email: result.user.email,
            phone_number: result.user.phone_number,
            full_name: result.user.full_name,
            credits_balance: result.user.credits_balance,
            user_type: result.user.user_type,
          },
          tokens: result.tokens,
        },
      });
    } catch (error: any) {
      throw new AppError(error.message, 401);
    }
  }

  async sendOTP(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      await AuthService.sendOTP(req.user.userId);

      res.json({
        success: true,
        message: 'OTP sent successfully',
      });
    } catch (error: any) {
      throw new AppError(error.message, 400);
    }
  }

  async verifyOTP(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      const { otp } = req.body;

      if (!otp) {
        throw new AppError('OTP is required', 400);
      }

      const isValid = await AuthService.verifyOTP(req.user.userId, otp);

      if (!isValid) {
        throw new AppError('Invalid or expired OTP', 400);
      }

      res.json({
        success: true,
        message: 'OTP verified successfully',
      });
    } catch (error: any) {
      throw new AppError(error.message, 400);
    }
  }

  async refreshToken(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw new AppError('Refresh token is required', 400);
      }

      const result = await AuthService.refreshAccessToken(refreshToken);

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      throw new AppError(error.message, 401);
    }
  }

  async logout(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      await AuthService.logout(req.user.userId);

      res.json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error: any) {
      throw new AppError(error.message, 400);
    }
  }

  async getProfile(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      const user = await require('../repositories/User.repository').default.findOne({
        where: { id: req.user.userId },
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      res.json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          phone_number: user.phone_number,
          full_name: user.full_name,
          avatar_url: user.avatar_url,
          credits_balance: user.credits_balance,
          user_type: user.user_type,
          email_verified: user.email_verified,
          phone_verified: user.phone_verified,
          created_at: user.created_at,
        },
      });
    } catch (error: any) {
      throw new AppError(error.message, 400);
    }
  }
}

export default new AuthController();
