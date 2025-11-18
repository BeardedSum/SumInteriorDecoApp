import { Repository } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { User } from '../entities/User.entity';

export class UserRepository extends Repository<User> {
  constructor() {
    super(User, AppDataSource.manager);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.findOne({ where: { email } });
  }

  async findByPhoneNumber(phoneNumber: string): Promise<User | null> {
    return this.findOne({ where: { phone_number: phoneNumber } });
  }

  async findByEmailOrPhone(email: string | null, phoneNumber: string | null): Promise<User | null> {
    if (email && phoneNumber) {
      return this.createQueryBuilder('user')
        .where('user.email = :email OR user.phone_number = :phoneNumber', { email, phoneNumber })
        .getOne();
    }
    if (email) {
      return this.findByEmail(email);
    }
    if (phoneNumber) {
      return this.findByPhoneNumber(phoneNumber);
    }
    return null;
  }

  async updateCreditsBalance(userId: string, amount: number): Promise<void> {
    await this.createQueryBuilder()
      .update(User)
      .set({ credits_balance: () => `credits_balance + ${amount}` })
      .where('id = :userId', { userId })
      .execute();
  }

  async setOtp(userId: string, otpCode: string, expiresAt: Date): Promise<void> {
    await this.update(userId, {
      otp_code: otpCode,
      otp_expires_at: expiresAt,
    });
  }

  async verifyOtp(userId: string, otpCode: string): Promise<boolean> {
    const user = await this.findOne({ where: { id: userId } });
    if (!user || !user.otp_code || !user.otp_expires_at) {
      return false;
    }

    const isValid = user.otp_code === otpCode && new Date() < user.otp_expires_at;
    if (isValid) {
      await this.update(userId, {
        otp_code: null,
        otp_expires_at: null,
        phone_verified: true,
      });
    }
    return isValid;
  }

  async updateLastLogin(userId: string, ip: string): Promise<void> {
    await this.update(userId, {
      last_login_at: new Date(),
      last_login_ip: ip,
    });
  }

  async getUserStats(userId: string): Promise<{
    totalProjects: number;
    totalGenerations: number;
    creditsUsed: number;
  }> {
    const user = await this.findOne({
      where: { id: userId },
      relations: ['projects', 'transactions'],
    });

    if (!user) {
      return { totalProjects: 0, totalGenerations: 0, creditsUsed: 0 };
    }

    const totalProjects = user.projects?.length || 0;

    // Calculate total generations from transactions
    const creditsUsed = user.transactions
      ?.filter((t) => t.transaction_type === 'credit_deduction')
      .reduce((sum, t) => sum + (t.credits_amount || 0), 0) || 0;

    return {
      totalProjects,
      totalGenerations: creditsUsed,
      creditsUsed,
    };
  }
}

export default new UserRepository();
