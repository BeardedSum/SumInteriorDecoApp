import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';
import PaymentService from '../services/payment.service';
import TransactionRepository from '../repositories/transaction.repository';
import CreditPackageRepository from '../repositories/credit-package.repository';
import SubscriptionRepository from '../repositories/subscription.repository';
import UserRepository from '../repositories/user.repository';

export class PaymentController {
  /**
   * Get all credit packages
   */
  async getCreditPackages(req: AuthRequest, res: Response) {
    try {
      const packages = await CreditPackageRepository.find({
        where: { is_active: true },
        order: { price: 'ASC' },
      });

      res.json({
        success: true,
        data: { packages },
      });
    } catch (error: any) {
      throw new AppError(error.message, 500);
    }
  }

  /**
   * Get subscription plans
   */
  async getSubscriptionPlans(req: AuthRequest, res: Response) {
    try {
      // Hardcoded subscription plans
      const plans = [
        {
          id: 'basic',
          name: 'Basic',
          price: 5000,
          currency: 'NGN',
          billing_cycle: 'monthly',
          monthly_credits: 30,
          features: [
            '30 renders/month',
            'No watermark',
            'All style presets',
            'HD quality',
            'WhatsApp sharing',
          ],
          popular: false,
        },
        {
          id: 'pro',
          name: 'Pro',
          price: 15000,
          currency: 'NGN',
          billing_cycle: 'monthly',
          monthly_credits: 100,
          features: [
            '100 renders/month',
            'Multi-view consistency',
            'Batch processing (10 images)',
            'Object removal',
            'Color editor',
            'Priority processing',
            'AI analysis',
          ],
          popular: true,
        },
        {
          id: 'agency',
          name: 'Agency',
          price: 40000,
          currency: 'NGN',
          billing_cycle: 'monthly',
          monthly_credits: 500,
          features: [
            '500 renders/month',
            'Unlimited projects',
            'API access',
            'White-label exports',
            'Team collaboration (5 users)',
            'Dedicated support',
            'Custom branding',
            'Video walkthroughs',
          ],
          popular: false,
        },
      ];

      res.json({
        success: true,
        data: { plans },
      });
    } catch (error: any) {
      throw new AppError(error.message, 500);
    }
  }

  /**
   * Initialize payment for credit purchase
   */
  async initializePayment(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { package_id, subscription_plan } = req.body;

      if (!package_id && !subscription_plan) {
        throw new AppError('Either package_id or subscription_plan is required', 400);
      }

      const user = await UserRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new AppError('User not found', 404);
      }

      let amount: number;
      let creditsAmount: number = 0;
      let transactionType: 'credit_purchase' | 'subscription' = 'credit_purchase';
      let description: string;

      if (package_id) {
        // Credit package purchase
        const packageData = await CreditPackageRepository.findOne({ where: { id: package_id } });
        if (!packageData) {
          throw new AppError('Package not found', 404);
        }

        amount = packageData.price;
        creditsAmount = packageData.credits + (packageData.bonus_credits || 0);
        description = `${packageData.name} - ${creditsAmount} credits`;
      } else {
        // Subscription purchase
        transactionType = 'subscription';

        const planPrices: any = {
          basic: 5000,
          pro: 15000,
          agency: 40000,
        };

        amount = planPrices[subscription_plan];
        if (!amount) {
          throw new AppError('Invalid subscription plan', 400);
        }

        description = `${subscription_plan.charAt(0).toUpperCase() + subscription_plan.slice(1)} Monthly Subscription`;
      }

      // Initialize payment with Paystack
      const paymentData = await PaymentService.initializePayment({
        email: user.email,
        amount,
        currency: 'NGN',
        metadata: {
          user_id: userId,
          package_id: package_id || undefined,
          subscription_plan: subscription_plan || undefined,
          credits_amount: creditsAmount,
          transaction_type: transactionType,
        },
      });

      // Create transaction record
      const transaction = TransactionRepository.create({
        user_id: userId,
        reference: paymentData.reference,
        transaction_type: transactionType,
        status: 'pending',
        payment_provider: 'paystack',
        amount,
        currency: 'NGN',
        credits_amount: creditsAmount,
        external_reference: null,
        payment_url: paymentData.authorization_url,
        description,
        expires_at: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
      });

      await TransactionRepository.save(transaction);

      res.json({
        success: true,
        data: {
          authorization_url: paymentData.authorization_url,
          reference: paymentData.reference,
          amount,
          transaction_id: transaction.id,
        },
      });
    } catch (error: any) {
      throw new AppError(error.message, error.statusCode || 500);
    }
  }

  /**
   * Verify payment
   */
  async verifyPayment(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { reference } = req.params;

      const transaction = await TransactionRepository.findOne({
        where: { reference, user_id: userId },
      });

      if (!transaction) {
        throw new AppError('Transaction not found', 404);
      }

      if (transaction.status === 'completed') {
        return res.json({
          success: true,
          data: {
            transaction,
            message: 'Payment already verified',
          },
        });
      }

      // Verify with Paystack
      const verification = await PaymentService.verifyPayment(reference);

      if (verification.status === 'success') {
        // Update transaction
        transaction.status = 'completed';
        transaction.paid_at = new Date();
        transaction.external_reference = verification.transaction_id;
        await TransactionRepository.save(transaction);

        // Add credits to user
        if (transaction.credits_amount > 0) {
          const user = await UserRepository.findOne({ where: { id: userId } });
          if (user) {
            user.credits_balance += transaction.credits_amount;
            await UserRepository.save(user);
          }
        }

        res.json({
          success: true,
          data: {
            transaction,
            message: 'Payment verified successfully',
          },
        });
      } else {
        transaction.status = 'failed';
        await TransactionRepository.save(transaction);

        throw new AppError('Payment verification failed', 400);
      }
    } catch (error: any) {
      throw new AppError(error.message, error.statusCode || 500);
    }
  }

  /**
   * Get user's transactions
   */
  async getTransactions(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { status, limit = 20, offset = 0 } = req.query;

      const queryBuilder = TransactionRepository.createQueryBuilder('transaction')
        .where('transaction.user_id = :userId', { userId })
        .orderBy('transaction.created_at', 'DESC')
        .take(Number(limit))
        .skip(Number(offset));

      if (status) {
        queryBuilder.andWhere('transaction.status = :status', { status });
      }

      const [transactions, total] = await queryBuilder.getManyAndCount();

      res.json({
        success: true,
        data: {
          transactions,
          pagination: {
            total,
            limit: Number(limit),
            offset: Number(offset),
          },
        },
      });
    } catch (error: any) {
      throw new AppError(error.message, 500);
    }
  }

  /**
   * Get user's active subscription
   */
  async getActiveSubscription(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;

      const subscription = await SubscriptionRepository.findOne({
        where: { user_id: userId, status: 'active' },
      });

      res.json({
        success: true,
        data: { subscription },
      });
    } catch (error: any) {
      throw new AppError(error.message, 500);
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;

      const subscription = await SubscriptionRepository.findOne({
        where: { user_id: userId, status: 'active' },
      });

      if (!subscription) {
        throw new AppError('No active subscription found', 404);
      }

      subscription.auto_renew = false;
      subscription.cancelled_at = new Date();
      await SubscriptionRepository.save(subscription);

      res.json({
        success: true,
        data: {
          subscription,
          message: 'Subscription will be cancelled at the end of the current period',
        },
      });
    } catch (error: any) {
      throw new AppError(error.message, error.statusCode || 500);
    }
  }
}

export default new PaymentController();
