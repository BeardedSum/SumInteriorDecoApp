import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import config from '../config';
import UserRepository from '../repositories/User.repository';
import { User, UserType } from '../entities/User.entity';
import TransactionRepository from '../repositories/Transaction.repository';
import { TransactionType, TransactionStatus, PaymentProvider } from '../entities/Transaction.entity';

interface SignupData {
  email?: string;
  phone_number?: string;
  full_name: string;
  password?: string;
}

interface LoginData {
  email?: string;
  phone_number?: string;
  password: string;
}

interface TokenPayload {
  userId: string;
  email: string | null;
  role: string;
}

export class AuthService {
  private static readonly SALT_ROUNDS = 12;

  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });
  }

  static generateRefreshToken(payload: TokenPayload): string {
    return jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn,
    });
  }

  static verifyAccessToken(token: string): TokenPayload {
    return jwt.verify(token, config.jwt.secret) as TokenPayload;
  }

  static verifyRefreshToken(token: string): TokenPayload {
    return jwt.verify(token, config.jwt.refreshSecret) as TokenPayload;
  }

  static generateOTP(): string {
    // Generate a 6-digit OTP
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  static getOTPExpiryDate(): Date {
    const expiryDate = new Date();
    expiryDate.setMinutes(expiryDate.getMinutes() + config.otp.expiryMinutes);
    return expiryDate;
  }

  static async signup(data: SignupData): Promise<{ user: User; tokens: { accessToken: string; refreshToken: string } }> {
    // Check if user already exists
    const existingUser = await UserRepository.findByEmailOrPhone(data.email || null, data.phone_number || null);
    if (existingUser) {
      throw new Error('User already exists with this email or phone number');
    }

    // Hash password if provided
    let passwordHash: string | null = null;
    if (data.password) {
      passwordHash = await this.hashPassword(data.password);
    }

    // Create user
    const user = UserRepository.create({
      email: data.email || null,
      phone_number: data.phone_number || null,
      password_hash: passwordHash,
      full_name: data.full_name,
      user_type: UserType.FREE,
      credits_balance: config.business.freeSignupCredits,
      email_verified: false,
      phone_verified: false,
    });

    await UserRepository.save(user);

    // Award free signup credits (create transaction record)
    const transaction = TransactionRepository.create({
      user_id: user.id,
      reference: `FREE-${nanoid(10)}`,
      transaction_type: TransactionType.FREE_CREDITS,
      status: TransactionStatus.COMPLETED,
      payment_provider: PaymentProvider.SYSTEM,
      amount: 0,
      currency: 'NGN',
      credits_amount: config.business.freeSignupCredits,
      description: 'Welcome bonus - Free signup credits',
      paid_at: new Date(),
    });

    await TransactionRepository.save(transaction);

    // Generate tokens
    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.generateAccessToken(tokenPayload);
    const refreshToken = this.generateRefreshToken(tokenPayload);

    // Save refresh token
    user.refresh_token = refreshToken;
    await UserRepository.save(user);

    return {
      user,
      tokens: { accessToken, refreshToken },
    };
  }

  static async login(data: LoginData, ip: string): Promise<{ user: User; tokens: { accessToken: string; refreshToken: string } }> {
    // Find user
    const user = await UserRepository.findByEmailOrPhone(data.email || null, data.phone_number || null);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    if (!user.password_hash || !data.password) {
      throw new Error('Invalid credentials');
    }

    const isPasswordValid = await this.comparePassword(data.password, user.password_hash);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Check if user is active
    if (!user.is_active) {
      throw new Error('Account is suspended. Please contact support.');
    }

    // Update last login
    await UserRepository.updateLastLogin(user.id, ip);

    // Generate tokens
    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.generateAccessToken(tokenPayload);
    const refreshToken = this.generateRefreshToken(tokenPayload);

    // Save refresh token
    user.refresh_token = refreshToken;
    await UserRepository.save(user);

    return {
      user,
      tokens: { accessToken, refreshToken },
    };
  }

  static async sendOTP(userId: string): Promise<string> {
    const otpCode = this.generateOTP();
    const expiresAt = this.getOTPExpiryDate();

    await UserRepository.setOtp(userId, otpCode, expiresAt);

    // TODO: Send OTP via SMS/Email service
    console.log(`OTP for user ${userId}: ${otpCode}`);

    return otpCode;
  }

  static async verifyOTP(userId: string, otpCode: string): Promise<boolean> {
    return UserRepository.verifyOtp(userId, otpCode);
  }

  static async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const payload = this.verifyRefreshToken(refreshToken);

      // Find user and verify refresh token
      const user = await UserRepository.findOne({ where: { id: payload.userId } });
      if (!user || user.refresh_token !== refreshToken) {
        throw new Error('Invalid refresh token');
      }

      // Generate new tokens
      const tokenPayload: TokenPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
      };

      const newAccessToken = this.generateAccessToken(tokenPayload);
      const newRefreshToken = this.generateRefreshToken(tokenPayload);

      // Update refresh token
      user.refresh_token = newRefreshToken;
      await UserRepository.save(user);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  static async logout(userId: string): Promise<void> {
    await UserRepository.update(userId, { refresh_token: null });
  }
}

export default AuthService;
