import { Request, Response, NextFunction } from 'express';
import AuthService from '../services/auth.service';
import UserRepository from '../repositories/User.repository';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string | null;
    role: string;
  };
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);

    try {
      const payload = AuthService.verifyAccessToken(token);

      // Verify user exists and is active
      const user = await UserRepository.findOne({ where: { id: payload.userId } });
      if (!user || !user.is_active) {
        return res.status(401).json({ error: 'Invalid or inactive user' });
      }

      req.user = payload;
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Authentication error' });
  }
};

export const optionalAuthMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      try {
        const payload = AuthService.verifyAccessToken(token);
        req.user = payload;
      } catch (error) {
        // Token is invalid, but that's okay for optional auth
      }
    }

    next();
  } catch (error) {
    next();
  }
};

export const adminMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};
