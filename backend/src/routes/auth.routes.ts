import { Router } from 'express';
import authController from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.post('/signup', (req, res, next) => authController.signup(req, res).catch(next));
router.post('/login', (req, res, next) => authController.login(req, res).catch(next));
router.post('/refresh', (req, res, next) => authController.refreshToken(req, res).catch(next));

// Protected routes
router.post('/send-otp', authMiddleware, (req, res, next) => authController.sendOTP(req, res).catch(next));
router.post('/verify-otp', authMiddleware, (req, res, next) => authController.verifyOTP(req, res).catch(next));
router.post('/logout', authMiddleware, (req, res, next) => authController.logout(req, res).catch(next));
router.get('/profile', authMiddleware, (req, res, next) => authController.getProfile(req, res).catch(next));

export default router;
