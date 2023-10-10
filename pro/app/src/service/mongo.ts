import mongoose from 'mongoose';
import { initService, initLogger } from './init';
import { authLicense } from './utils/auth';
import { exit } from 'process';
import dayjs from 'dayjs';

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
    await authLicense();
  } catch (error) {
    console.log(error);
    return exit(1);
  }

  console.log('license load', {
    maxRegister: global.licenseData.maxRegister,
    expiredTime: dayjs(global.licenseData.exp * 1000).format('YYYY-MM-DD')
  });

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
}

export * from './models/authCode';
export * from './models/user';
export * from './models/pay';
export * from './models/openapi';
export * from './models/image';
export * from './models/promotionRecord';
export * from './models/inform';
