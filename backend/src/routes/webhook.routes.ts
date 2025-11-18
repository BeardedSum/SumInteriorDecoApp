import { Router } from 'express';
import webhookController from '../controllers/webhook.controller';
import express from 'express';

const router = Router();

// Webhook routes - use raw body parser for signature verification
router.post(
  '/paystack',
  express.raw({ type: 'application/json' }),
  (req, res, next) => webhookController.handlePaystackWebhook(req, res).catch(next)
);

router.post(
  '/flutterwave',
  express.raw({ type: 'application/json' }),
  (req, res, next) => webhookController.handleFlutterwaveWebhook(req, res).catch(next)
);

export default router;
