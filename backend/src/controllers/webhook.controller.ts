import { Request, Response } from 'express';
import crypto from 'crypto';
import config from '../config';
import { AppError } from '../middleware/error.middleware';
import TransactionRepository from '../repositories/transaction.repository';
import UserRepository from '../repositories/user.repository';
import SubscriptionRepository from '../repositories/subscription.repository';

export class WebhookController {
  /**
   * Handle Paystack webhook events
   */
  async handlePaystackWebhook(req: Request, res: Response) {
    try {
      // Verify webhook signature
      const hash = crypto
        .createHmac('sha512', config.paystack.secretKey)
        .update(JSON.stringify(req.body))
        .digest('hex');

      const signature = req.headers['x-paystack-signature'];

      if (hash !== signature) {
        console.error('Invalid webhook signature');
        return res.status(401).json({ error: 'Invalid signature' });
      }

      const event = req.body;

      console.log('Paystack webhook received:', event.event);

      // Handle different event types
      switch (event.event) {
        case 'charge.success':
          await this.handleSuccessfulPayment(event.data);
          break;

        case 'charge.failed':
          await this.handleFailedPayment(event.data);
          break;

        case 'subscription.create':
          await this.handleSubscriptionCreated(event.data);
          break;

        case 'subscription.disable':
          await this.handleSubscriptionCancelled(event.data);
          break;

        case 'subscription.not_renew':
          await this.handleSubscriptionNotRenewed(event.data);
          break;

        default:
          console.log('Unhandled webhook event:', event.event);
      }

      res.status(200).json({ status: 'success' });
    } catch (error: any) {
      console.error('Webhook processing error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }

  /**
   * Handle successful payment
   */
  private async handleSuccessfulPayment(data: any) {
    try {
      const reference = data.reference;

      // Find transaction
      const transaction = await TransactionRepository.findOne({
        where: { reference },
        relations: ['user'],
      });

      if (!transaction) {
        console.error('Transaction not found:', reference);
        return;
      }

      if (transaction.status === 'completed') {
        console.log('Transaction already completed:', reference);
        return;
      }

      // Update transaction status
      transaction.status = 'completed';
      transaction.external_reference = data.id?.toString();
      transaction.paid_at = new Date();
      transaction.payment_metadata = {
        channel: data.channel,
        card_type: data.authorization?.card_type,
        bank: data.authorization?.bank,
        customer_code: data.customer?.customer_code,
      } as any;

      await TransactionRepository.save(transaction);

      // Add credits to user if it's a credit purchase
      if (transaction.transaction_type === 'credit_purchase' && transaction.credits_amount > 0) {
        const user = await UserRepository.findOne({ where: { id: transaction.user_id } });
        if (user) {
          user.credits_balance += transaction.credits_amount;
          await UserRepository.save(user);

          console.log(
            `Added ${transaction.credits_amount} credits to user ${user.id}. New balance: ${user.credits_balance}`
          );
        }
      }

      // Handle subscription payments
      if (transaction.transaction_type === 'subscription') {
        await this.handleSubscriptionPayment(transaction.user_id, data);
      }

      console.log('Payment processed successfully:', reference);
    } catch (error) {
      console.error('Error handling successful payment:', error);
      throw error;
    }
  }

  /**
   * Handle failed payment
   */
  private async handleFailedPayment(data: any) {
    try {
      const reference = data.reference;

      const transaction = await TransactionRepository.findOne({ where: { reference } });

      if (!transaction) {
        console.error('Transaction not found:', reference);
        return;
      }

      transaction.status = 'failed';
      transaction.payment_metadata = {
        error_message: data.gateway_response,
      } as any;

      await TransactionRepository.save(transaction);

      console.log('Payment failed:', reference);
    } catch (error) {
      console.error('Error handling failed payment:', error);
      throw error;
    }
  }

  /**
   * Handle subscription created
   */
  private async handleSubscriptionCreated(data: any) {
    try {
      // This would be called when a subscription is first created
      // Implementation depends on how you set up recurring payments
      console.log('Subscription created:', data);
    } catch (error) {
      console.error('Error handling subscription creation:', error);
      throw error;
    }
  }

  /**
   * Handle subscription cancelled
   */
  private async handleSubscriptionCancelled(data: any) {
    try {
      const subscriptionCode = data.subscription_code;

      const subscription = await SubscriptionRepository.findOne({
        where: { external_subscription_id: subscriptionCode },
      });

      if (subscription) {
        subscription.status = 'cancelled';
        subscription.cancelled_at = new Date();
        subscription.auto_renew = false;

        await SubscriptionRepository.save(subscription);

        console.log('Subscription cancelled:', subscriptionCode);
      }
    } catch (error) {
      console.error('Error handling subscription cancellation:', error);
      throw error;
    }
  }

  /**
   * Handle subscription not renewed
   */
  private async handleSubscriptionNotRenewed(data: any) {
    try {
      const subscriptionCode = data.subscription_code;

      const subscription = await SubscriptionRepository.findOne({
        where: { external_subscription_id: subscriptionCode },
      });

      if (subscription) {
        subscription.status = 'expired';
        subscription.auto_renew = false;

        await SubscriptionRepository.save(subscription);

        console.log('Subscription not renewed:', subscriptionCode);
      }
    } catch (error) {
      console.error('Error handling subscription not renewed:', error);
      throw error;
    }
  }

  /**
   * Handle subscription payment processing
   */
  private async handleSubscriptionPayment(userId: string, paymentData: any) {
    try {
      // Find active subscription or create new one
      let subscription = await SubscriptionRepository.findOne({
        where: { user_id: userId, status: 'active' },
      });

      if (!subscription) {
        // Create new subscription
        // Note: This is simplified - you'd extract plan details from metadata
        subscription = SubscriptionRepository.create({
          user_id: userId,
          plan: 'basic', // Extract from metadata
          status: 'active',
          billing_cycle: 'monthly',
          price: paymentData.amount / 100, // Convert from kobo
          currency: 'NGN',
          monthly_credits: 30, // Based on plan
          current_period_start: new Date(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          auto_renew: true,
          external_subscription_id: paymentData.authorization?.authorization_code,
          payment_provider: 'paystack',
        });
      } else {
        // Renew existing subscription
        subscription.current_period_start = new Date();
        subscription.current_period_end = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        subscription.status = 'active';
      }

      await SubscriptionRepository.save(subscription);

      // Add monthly credits
      const user = await UserRepository.findOne({ where: { id: userId } });
      if (user) {
        user.credits_balance += subscription.monthly_credits;
        user.user_type = subscription.plan as any;
        await UserRepository.save(user);
      }

      console.log('Subscription payment processed for user:', userId);
    } catch (error) {
      console.error('Error handling subscription payment:', error);
      throw error;
    }
  }

  /**
   * Handle Flutterwave webhook (placeholder for future implementation)
   */
  async handleFlutterwaveWebhook(req: Request, res: Response) {
    try {
      // Verify webhook signature
      const secretHash = config.flutterwave?.secretKey || process.env.FLUTTERWAVE_SECRET_HASH;
      const signature = req.headers['verif-hash'];

      if (!secretHash || signature !== secretHash) {
        return res.status(401).json({ error: 'Invalid signature' });
      }

      const event = req.body;

      console.log('Flutterwave webhook received:', event.event);

      // Handle events similar to Paystack
      // Implementation would go here

      res.status(200).json({ status: 'success' });
    } catch (error: any) {
      console.error('Flutterwave webhook error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }
}

export default new WebhookController();
