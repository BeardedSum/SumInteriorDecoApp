import UserRepository from '../repositories/User.repository';
import TransactionRepository from '../repositories/Transaction.repository';
import { TransactionType, TransactionStatus, PaymentProvider } from '../entities/Transaction.entity';
import { nanoid } from 'nanoid';

export class CreditService {
  /**
   * Check if user has enough credits
   */
  async hasEnoughCredits(userId: string, requiredCredits: number): Promise<boolean> {
    const user = await UserRepository.findOne({ where: { id: userId } });
    if (!user) return false;
    return user.credits_balance >= requiredCredits;
  }

  /**
   * Deduct credits from user
   */
  async deductCredits(userId: string, amount: number, description: string = 'Credit usage'): Promise<void> {
    const user = await UserRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    if (user.credits_balance < amount) {
      throw new Error('Insufficient credits');
    }

    // Deduct credits
    await UserRepository.updateCreditsBalance(userId, -amount);

    // Create transaction record
    const transaction = TransactionRepository.create({
      user_id: userId,
      reference: `DEDUCT-${nanoid(10)}`,
      transaction_type: TransactionType.CREDIT_DEDUCTION,
      status: TransactionStatus.COMPLETED,
      payment_provider: PaymentProvider.SYSTEM,
      amount: 0,
      currency: 'NGN',
      credits_amount: -amount,
      description,
      paid_at: new Date(),
    });

    await TransactionRepository.save(transaction);
  }

  /**
   * Add credits to user
   */
  async addCredits(userId: string, amount: number, description: string = 'Credits added'): Promise<void> {
    await UserRepository.updateCreditsBalance(userId, amount);

    // Create transaction record
    const transaction = TransactionRepository.create({
      user_id: userId,
      reference: `ADD-${nanoid(10)}`,
      transaction_type: TransactionType.FREE_CREDITS,
      status: TransactionStatus.COMPLETED,
      payment_provider: PaymentProvider.SYSTEM,
      amount: 0,
      currency: 'NGN',
      credits_amount: amount,
      description,
      paid_at: new Date(),
    });

    await TransactionRepository.save(transaction);
  }

  /**
   * Get user credits balance
   */
  async getCreditsBalance(userId: string): Promise<number> {
    const user = await UserRepository.findOne({ where: { id: userId } });
    if (!user) return 0;
    return user.credits_balance;
  }

  /**
   * Get credit usage history
   */
  async getCreditHistory(userId: string, limit: number = 50) {
    return TransactionRepository.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
      take: limit,
    });
  }

  /**
   * Calculate credits cost for generation
   */
  calculateGenerationCost(mode: string, styleIsPremium: boolean = false): number {
    const baseCosts: Record<string, number> = {
      '3d_vision': 1,
      '2d_redesign': 1,
      'virtual_staging': 2,
      'freestyle': 1,
      'object_removal': 1,
      'color_material': 1,
    };

    const cost = baseCosts[mode] || 1;
    return styleIsPremium ? cost + 1 : cost;
  }
}

export default new CreditService();
