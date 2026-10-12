import mongoose from 'mongoose';
import { env } from './env.ts';
import { logger } from '../utils/logger.ts';

export interface DatabaseStatus {
  isConnected: boolean;
  mode: 'mongodb' | 'memory-fallback';
  host?: string;
  name?: string;
}

let dbStatus: DatabaseStatus = {
  isConnected: false,
  mode: 'memory-fallback',
};

export async function connectDatabase(): Promise<DatabaseStatus> {
  // If already connected to mongoose
  if (mongoose.connection.readyState === 1) {
    dbStatus = {
      isConnected: true,
      mode: 'mongodb',
      host: mongoose.connection.host,
      name: mongoose.connection.name,
    };
    return dbStatus;
  }

  // Attempt real connection with short initial timeout so server starts rapidly
  try {
    logger.info('Connecting to MongoDB...', { uri: env.MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@') });
    
    // Setting short server selection timeout for local fallback resilience
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 2000,
      connectTimeoutMS: 2000,
    });

    dbStatus = {
      isConnected: true,
      mode: 'mongodb',
      host: mongoose.connection.host,
      name: mongoose.connection.name,
    };

    logger.info('Connected to MongoDB successfully', {
      host: mongoose.connection.host,
      database: mongoose.connection.name,
    });

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB runtime connection error', err);
      dbStatus.isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB connection lost. Falling back to persistent memory mode.');
      dbStatus.isConnected = false;
    });

    return dbStatus;
  } catch (error) {
    logger.warn('Local MongoDB daemon not reachable. Enabling high-fidelity memory fallback store for seamless local execution.', {
      error: error instanceof Error ? error.message : String(error),
    });

    dbStatus = {
      isConnected: true,
      mode: 'memory-fallback',
      name: 'codesentinel_memory_db',
    };

    return dbStatus;
  }
}

export function getDatabaseStatus(): DatabaseStatus {
  if (mongoose.connection.readyState === 1) {
    return {
      isConnected: true,
      mode: 'mongodb',
      host: mongoose.connection.host,
      name: mongoose.connection.name,
    };
  }
  return dbStatus;
}
