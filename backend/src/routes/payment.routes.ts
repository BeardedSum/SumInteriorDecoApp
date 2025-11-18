import { Router } from 'express';
import paymentController from '../controllers/payment.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All payment routes require authentication
router.use(authMiddleware);

// Credit packages
router.get('/credit-packages', (req, res, next) => paymentController.getCreditPackages(req, res).catch(next));

// Subscription plans
router.get('/subscription-plans', (req, res, next) => paymentController.getSubscriptionPlans(req, res).catch(next));

// Payment operations
router.post('/initialize', (req, res, next) => paymentController.initializePayment(req, res).catch(next));
router.get('/verify/:reference', (req, res, next) => paymentController.verifyPayment(req, res).catch(next));
router.get('/transactions', (req, res, next) => paymentController.getTransactions(req, res).catch(next));

// Subscription management
router.get('/subscription', (req, res, next) => paymentController.getActiveSubscription(req, res).catch(next));
router.post('/subscription/cancel', (req, res, next) => paymentController.cancelSubscription(req, res).catch(next));

export default router;
