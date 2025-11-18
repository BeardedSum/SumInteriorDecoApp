import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './User.entity';

export enum TransactionType {
  CREDIT_PURCHASE = 'credit_purchase',
  SUBSCRIPTION = 'subscription',
  CREDIT_DEDUCTION = 'credit_deduction',
  REFUND = 'refund',
  FREE_CREDITS = 'free_credits',
}

export enum TransactionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum PaymentProvider {
  PAYSTACK = 'paystack',
  FLUTTERWAVE = 'flutterwave',
  MANUAL = 'manual',
  SYSTEM = 'system',
}

@Entity('transactions')
@Index(['user_id'])
@Index(['status'])
@Index(['transaction_type'])
@Index(['created_at'])
@Index(['reference'])
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  reference: string;

  @Column({
    type: 'enum',
    enum: TransactionType,
  })
  transaction_type: TransactionType;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status: TransactionStatus;

  @Column({
    type: 'enum',
    enum: PaymentProvider,
    nullable: true,
  })
  payment_provider: PaymentProvider | null;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 10, default: 'NGN' })
  currency: string;

  @Column({ type: 'int', nullable: true })
  credits_amount: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  external_reference: string | null; // Paystack/Flutterwave reference

  @Column({ type: 'varchar', length: 500, nullable: true })
  payment_url: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'jsonb', nullable: true })
  payment_metadata: Record<string, any> | null;

  @Column({ type: 'timestamp', nullable: true })
  paid_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  expires_at: Date | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.transactions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
