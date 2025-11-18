import axios from 'axios';
import { nanoid } from 'nanoid';
import config from '../config';
import TransactionRepository from '../repositories/Transaction.repository';
import UserRepository from '../repositories/User.repository';
import { Transaction, TransactionType, TransactionStatus, PaymentProvider } from '../entities/Transaction.entity';

interface InitiatePaymentParams {
  userId: string;
  amount: number;
  creditsAmount?: number;
  email: string;
  description?: string;
  metadata?: Record<string, any>;
}

interface PaymentResponse {
  success: boolean;
  authorizationUrl?: string;
  reference: string;
  transaction?: Transaction;
}

interface VerifyPaymentResponse {
  success: boolean;
  transaction?: Transaction;
  message?: string;
}

export class PaymentService {
  private paystackBaseUrl = 'https://api.paystack.co';
  private paystackSecretKey = config.payments.paystack.secretKey;

  /**
   * Initialize Paystack payment
   */
  async initiatePaystackPayment(params: InitiatePaymentParams): Promise<PaymentResponse> {
    const { userId, amount, creditsAmount, email, description, metadata } = params;

    // Generate unique reference
    const reference = `PAY-${nanoid(16)}`;

    try {
      // Create transaction record
      const transaction = TransactionRepository.create({
        user_id: userId,
        reference,
        transaction_type: creditsAmount ? TransactionType.CREDIT_PURCHASE : TransactionType.SUBSCRIPTION,
        status: TransactionStatus.PENDING,
        payment_provider: PaymentProvider.PAYSTACK,
        amount: amount / 100, // Convert from kobo to naira
        currency: 'NGN',
        credits_amount: creditsAmount || null,
        description: description || 'Payment',
        payment_metadata: metadata || null,
        expires_at: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes expiry
      });

      await TransactionRepository.save(transaction);

      // Initialize Paystack payment
      const response = await axios.post(
        `${this.paystackBaseUrl}/transaction/initialize`,
        {
          email,
          amount: amount, // Amount in kobo
          reference,
          metadata: {
            userId,
            creditsAmount,
            ...metadata,
          },
          callback_url: `${config.frontendUrl}/payment/callback`,
        },
        {
          headers: {
            Authorization: `Bearer ${this.paystackSecretKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.status) {
        // Update transaction with payment URL
        transaction.payment_url = response.data.data.authorization_url;
        transaction.external_reference = response.data.data.reference;
        await TransactionRepository.save(transaction);

        return {
          success: true,
          authorizationUrl: response.data.data.authorization_url,
          reference,
          transaction,
        };
      }

      throw new Error('Failed to initialize payment');
    } catch (error: any) {
      console.error('Paystack payment initialization error:', error);
      throw new Error(`Payment initialization failed: ${error.message}`);
    }
  }

  /**
   * Verify Paystack payment
   */
  async verifyPaystackPayment(reference: string): Promise<VerifyPaymentResponse> {
    try {
      const response = await axios.get(`${this.paystackBaseUrl}/transaction/verify/${reference}`, {
        headers: {
          Authorization: `Bearer ${this.paystackSecretKey}`,
        },
      });

      if (response.data.status && response.data.data.status === 'success') {
        // Find transaction
        const transaction = await TransactionRepository.findByReference(reference);
        if (!transaction) {
          return { success: false, message: 'Transaction not found' };
        }

        // Update transaction status
        transaction.status = TransactionStatus.COMPLETED;
        transaction.paid_at = new Date();
        await TransactionRepository.save(transaction);

        // Add credits to user if credit purchase
        if (transaction.credits_amount && transaction.credits_amount > 0) {
          await UserRepository.updateCreditsBalance(transaction.user_id, transaction.credits_amount);
        }

        return {
          success: true,
          transaction,
        };
      }

      return {
        success: false,
        message: 'Payment verification failed',
      };
    } catch (error: any) {
      console.error('Paystack payment verification error:', error);
      throw new Error(`Payment verification failed: ${error.message}`);
    }
  }

  /**
   * Handle Paystack webhook
   */
  async handlePaystackWebhook(payload: any): Promise<void> {
    try {
      const { event, data } = payload;

      if (event === 'charge.success') {
        const reference = data.reference;
        const transaction = await TransactionRepository.findByReference(reference);

        if (transaction && transaction.status === TransactionStatus.PENDING) {
          transaction.status = TransactionStatus.COMPLETED;
          transaction.paid_at = new Date();
          await TransactionRepository.save(transaction);

          // Add credits to user
          if (transaction.credits_amount && transaction.credits_amount > 0) {
            await UserRepository.updateCreditsBalance(transaction.user_id, transaction.credits_amount);
          }
        }
      }
    } catch (error: any) {
      console.error('Webhook handling error:', error);
      throw new Error(`Webhook handling failed: ${error.message}`);
    }
  }

  /**
   * Get credit packages with prices
   */
  getCreditPackages() {
    return [
      {
        id: 'small',
        name: 'Starter Pack',
        credits: 10,
        bonus: 0,
        price: config.business.creditPacks.small,
        currency: 'NGN',
      },
      {
        id: 'medium',
        name: 'Popular Pack',
        credits: 30,
        bonus: 5,
        price: config.business.creditPacks.medium,
        currency: 'NGN',
      },
      {
        id: 'large',
        name: 'Professional Pack',
        credits: 100,
        bonus: 20,
        price: config.business.creditPacks.large,
        currency: 'NGN',
      },
    ];
  }

  /**
   * Get subscription plans with prices
   */
  getSubscriptionPlans() {
    return [
      {
        id: 'basic',
        name: 'Basic',
        price: config.business.plans.basic,
        currency: 'NGN',
        credits: 30,
        features: ['30 renders/month', 'No watermark', 'All style presets', 'HD quality'],
      },
      {
        id: 'pro',
        name: 'Pro',
        price: config.business.plans.pro,
        currency: 'NGN',
        credits: 100,
        features: [
          '100 renders/month',
          'Multi-view consistency',
          'Batch processing',
          'Object removal',
          'Priority processing',
        ],
      },
      {
        id: 'agency',
        name: 'Agency',
        price: config.business.plans.agency,
        currency: 'NGN',
        credits: 500,
        features: [
          '500 renders/month',
          'Unlimited projects',
          'API access',
          'White-label exports',
          'Team collaboration',
          'Dedicated support',
        ],
      },
    ];
  }
}

export default new PaymentService();
