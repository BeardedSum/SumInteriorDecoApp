import { Repository } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { Transaction, TransactionStatus, TransactionType } from '../entities/Transaction.entity';

export class TransactionRepository extends Repository<Transaction> {
  constructor() {
    super(Transaction, AppDataSource.manager);
  }

  async findByUserId(userId: string, limit?: number): Promise<Transaction[]> {
    const query = this.createQueryBuilder('transaction')
      .where('transaction.user_id = :userId', { userId })
      .orderBy('transaction.created_at', 'DESC');

    if (limit) {
      query.take(limit);
    }

    return query.getMany();
  }

  async findByReference(reference: string): Promise<Transaction | null> {
    return this.findOne({ where: { reference } });
  }

  async findByExternalReference(externalReference: string): Promise<Transaction | null> {
    return this.findOne({ where: { external_reference: externalReference } });
  }

  async markAsCompleted(transactionId: string): Promise<void> {
    await this.update(transactionId, {
      status: TransactionStatus.COMPLETED,
      paid_at: new Date(),
    });
  }

  async markAsFailed(transactionId: string): Promise<void> {
    await this.update(transactionId, {
      status: TransactionStatus.FAILED,
    });
  }

  async getUserTransactionStats(userId: string): Promise<{
    totalSpent: number;
    totalCreditsAdded: number;
    totalCreditsUsed: number;
  }> {
    const transactions = await this.find({
      where: { user_id: userId, status: TransactionStatus.COMPLETED },
    });

    const totalSpent = transactions
      .filter((t) => t.transaction_type === TransactionType.CREDIT_PURCHASE || t.transaction_type === TransactionType.SUBSCRIPTION)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalCreditsAdded = transactions
      .filter((t) => t.transaction_type === TransactionType.CREDIT_PURCHASE || t.transaction_type === TransactionType.FREE_CREDITS)
      .reduce((sum, t) => sum + (t.credits_amount || 0), 0);

    const totalCreditsUsed = transactions
      .filter((t) => t.transaction_type === TransactionType.CREDIT_DEDUCTION)
      .reduce((sum, t) => sum + Math.abs(t.credits_amount || 0), 0);

    return {
      totalSpent,
      totalCreditsAdded,
      totalCreditsUsed,
    };
  }
}

export default new TransactionRepository();
