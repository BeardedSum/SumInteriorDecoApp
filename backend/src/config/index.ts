import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface Config {
  // Server
  nodeEnv: string;
  port: number;
  apiUrl: string;
  frontendUrl: string;

  // Database
  database: {
    url: string;
    host: string;
    port: number;
    username: string;
    password: string;
    name: string;
    synchronize: boolean;
    logging: boolean;
  };

  // Redis
  redis: {
    host: string;
    port: number;
    password?: string;
    db: number;
  };

  // JWT
  jwt: {
    secret: string;
    expiresIn: string;
    refreshSecret: string;
    refreshExpiresIn: string;
  };

  // OTP
  otp: {
    expiryMinutes: number;
    length: number;
  };

  // AI Services
  ai: {
    replicate: {
      apiKey: string;
    };
    google: {
      apiKey: string;
    };
    anthropic: {
      apiKey: string;
    };
  };

  // Cloudinary
  cloudinary: {
    cloudName: string;
    apiKey: string;
    apiSecret: string;
    folder: string;
  };

  // Payments
  payments: {
    paystack: {
      secretKey: string;
      publicKey: string;
      webhookSecret: string;
    };
    flutterwave: {
      secretKey: string;
      publicKey: string;
      encryptionKey: string;
    };
  };

  // SMS
  sms: {
    provider: 'twilio' | 'africastalking' | 'termii';
    twilio?: {
      accountSid: string;
      authToken: string;
      phoneNumber: string;
    };
    africastalking?: {
      username: string;
      apiKey: string;
    };
    termii?: {
      apiKey: string;
      senderId: string;
    };
  };

  // Email
  email: {
    provider: 'sendgrid' | 'resend';
    sendgrid?: {
      apiKey: string;
      fromEmail: string;
      fromName: string;
    };
    resend?: {
      apiKey: string;
    };
  };

  // WhatsApp
  whatsapp?: {
    apiKey: string;
    phoneNumberId: string;
  };

  // Analytics
  analytics?: {
    googleAnalyticsId: string;
  };

  // Error Tracking
  sentry?: {
    dsn: string;
  };

  // Rate Limiting
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };

  // File Upload
  upload: {
    maxFileSizeMb: number;
    allowedFormats: string[];
  };

  // Business Logic
  business: {
    freeSignupCredits: number;
    plans: {
      basic: number;
      pro: number;
      agency: number;
    };
    creditPacks: {
      small: number;
      medium: number;
      large: number;
    };
  };

  // Generation
  generation: {
    timeoutMs: number;
    maxConcurrent: number;
  };

  // Logging
  logging: {
    level: string;
    filePath: string;
  };
}

const config: Config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  apiUrl: process.env.API_URL || 'http://localhost:3000',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

  database: {
    url: process.env.DATABASE_URL || '',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'SumDeco',
    // synchronize: process.env.DB_SYNCHRONIZE === 'true', 
    synchronize: true,
    logging: process.env.DB_LOGGING === 'true',
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  otp: {
    expiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES || '10', 10),
    length: parseInt(process.env.OTP_LENGTH || '6', 10),
  },

  ai: {
    replicate: {
      apiKey: process.env.REPLICATE_API_KEY || '',
    },
    google: {
      apiKey: process.env.GOOGLE_AI_API_KEY || '',
    },
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY || '',
    },
  },

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    folder: process.env.CLOUDINARY_FOLDER || 'sum-decor',
  },

  payments: {
    paystack: {
      secretKey: process.env.PAYSTACK_SECRET_KEY || '',
      publicKey: process.env.PAYSTACK_PUBLIC_KEY || '',
      webhookSecret: process.env.PAYSTACK_WEBHOOK_SECRET || '',
    },
    flutterwave: {
      secretKey: process.env.FLUTTERWAVE_SECRET_KEY || '',
      publicKey: process.env.FLUTTERWAVE_PUBLIC_KEY || '',
      encryptionKey: process.env.FLUTTERWAVE_ENCRYPTION_KEY || '',
    },
  },

  sms: {
    provider: (process.env.SMS_PROVIDER as 'twilio' | 'africastalking' | 'termii') || 'termii',
    twilio: process.env.TWILIO_ACCOUNT_SID
      ? {
          accountSid: process.env.TWILIO_ACCOUNT_SID,
          authToken: process.env.TWILIO_AUTH_TOKEN || '',
          phoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
        }
      : undefined,
    africastalking: process.env.AFRICASTALKING_API_KEY
      ? {
          username: process.env.AFRICASTALKING_USERNAME || '',
          apiKey: process.env.AFRICASTALKING_API_KEY,
        }
      : undefined,
    termii: process.env.TERMII_API_KEY
      ? {
          apiKey: process.env.TERMII_API_KEY,
          senderId: process.env.TERMII_SENDER_ID || 'SumDecor',
        }
      : undefined,
  },

  email: {
    provider: (process.env.EMAIL_PROVIDER as 'sendgrid' | 'resend') || 'sendgrid',
    sendgrid: process.env.SENDGRID_API_KEY
      ? {
          apiKey: process.env.SENDGRID_API_KEY,
          fromEmail: process.env.SENDGRID_FROM_EMAIL || 'noreply@sumdecor.com',
          fromName: process.env.SENDGRID_FROM_NAME || 'Sum Decor AI',
        }
      : undefined,
    resend: process.env.RESEND_API_KEY
      ? {
          apiKey: process.env.RESEND_API_KEY,
        }
      : undefined,
  },

  whatsapp: process.env.WHATSAPP_BUSINESS_API_KEY
    ? {
        apiKey: process.env.WHATSAPP_BUSINESS_API_KEY,
        phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
      }
    : undefined,

  analytics: process.env.GOOGLE_ANALYTICS_ID
    ? {
        googleAnalyticsId: process.env.GOOGLE_ANALYTICS_ID,
      }
    : undefined,

  sentry: process.env.SENTRY_DSN
    ? {
        dsn: process.env.SENTRY_DSN,
      }
    : undefined,

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  upload: {
    maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10),
    allowedFormats: (process.env.ALLOWED_IMAGE_FORMATS || 'jpg,jpeg,png,webp').split(','),
  },

  business: {
    freeSignupCredits: parseInt(process.env.FREE_SIGNUP_CREDITS || '5', 10),
    plans: {
      basic: parseInt(process.env.PLAN_BASIC_PRICE || '5000', 10),
      pro: parseInt(process.env.PLAN_PRO_PRICE || '15000', 10),
      agency: parseInt(process.env.PLAN_AGENCY_PRICE || '40000', 10),
    },
    creditPacks: {
      small: parseInt(process.env.CREDIT_PACK_10_PRICE || '1000', 10),
      medium: parseInt(process.env.CREDIT_PACK_30_PRICE || '2500', 10),
      large: parseInt(process.env.CREDIT_PACK_100_PRICE || '8000', 10),
    },
  },

  generation: {
    timeoutMs: parseInt(process.env.DEFAULT_GENERATION_TIMEOUT_MS || '60000', 10),
    maxConcurrent: parseInt(process.env.MAX_CONCURRENT_GENERATIONS || '3', 10),
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
    filePath: process.env.LOG_FILE_PATH || 'logs/app.log',
  },
};

export default config;
