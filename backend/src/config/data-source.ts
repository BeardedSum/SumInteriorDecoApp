import { DataSource } from 'typeorm';
import config from './index';
import path from 'path';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: config.database.url,
  host: config.database.host,
  port: config.database.port,
  username: config.database.username,
  password: config.database.password,
  database: config.database.name,
  synchronize: config.database.synchronize, // Set to false in production
  logging: config.database.logging,
  entities: [path.join(__dirname, '../entities/**/*.entity{.ts,.js}')],
  migrations: [path.join(__dirname, '../database/migrations/**/*{.ts,.js}')],
  subscribers: [],
  // Connection pooling
  extra: {
    max: 20, // Maximum pool size
    min: 5, // Minimum pool size
    idleTimeoutMillis: 10000, // Idle timeout
    connectionTimeoutMillis: 2000, // Connection timeout
  },
  // SSL configuration for production
  ssl: config.nodeEnv === 'production' ? { rejectUnauthorized: false } : false,
});

// Initialize connection
export const initializeDatabase = async (): Promise<void> => {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connection established successfully');
  } catch (error) {
    console.error('❌ Error during database initialization:', error);
    throw error;
  }
};

export default AppDataSource;
