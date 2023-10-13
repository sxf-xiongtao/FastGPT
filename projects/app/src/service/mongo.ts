import mongoose from 'mongoose';
import { initService, initLogger } from './init';
import { authLicense } from '@/utils/service/common/license';
import { exit } from 'process';

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

    try {
      await authLicense();
    } catch (error) {
      console.log(error);
      return exit(1);
    }

    console.log('mongo connected');
  } catch (error) {
    console.log('error->', 'mongo connect error');
    global.mongodb = null;
  }
}

export * from './models/authCode';
export * from './models/pay';
export * from './models/image';
export * from './models/promotionRecord';
export * from './models/inform';
