import mongoose from 'mongoose';
import { startQueue } from './utils/tools';
import { initService, initLogger } from './init';

/**
 * connect MongoDB and init data
 */
export async function connectToDatabase(): Promise<void> {
  if (global.mongodb) {
    return;
  }
  global.mongodb = 'connecting';

  initService();
  initLogger();

  try {
    mongoose.set('strictQuery', true);
    global.mongodb = await mongoose.connect(process.env.MONGODB_URI as string, {
      bufferCommands: true,
      maxConnecting: Number(process.env.DB_MAX_LINK || 5),
      maxPoolSize: Number(process.env.DB_MAX_LINK || 5),
      minPoolSize: 2
    });

    console.log('mongo connected');
  } catch (error) {
    console.log('error->', 'mongo connect error');
    global.mongodb = null;
  }

  // init function
  startQueue();
}

export * from './models/authCode';
export * from './models/user';
export * from './models/pay';
export * from './models/openapi';
export * from './models/image';
