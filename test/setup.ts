import { readFileSync } from 'fs';
import mongoose from '@fastgpt/service/common/mongo';
import { connectMongo } from '@fastgpt/service/common/mongo/init';
import {
  connectionMongo,
  connectionLogMongo,
  MONGO_URL,
  MONGO_LOG_URL
} from '@fastgpt/service/common/mongo';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { setup, teardown } from 'vitest-mongodb';
import '@test/mocks';

vi.stubEnv('NODE_ENV', 'test');

vi.mock(import('@fastgpt/service/common/mongo'), async (importOriginal) => {
  const mod = await importOriginal();
  return {
    ...mod,
    connectionMongo: await (async () => {
      if (!global.mongodb) {
        global.mongodb = mongoose;
        await global.mongodb.connect((globalThis as any).__MONGO_URI__ as string);
      }

      return global.mongodb;
    })()
  };
});

beforeAll(async () => {
  await setup({
    type: 'replSet',
    serverOptions: {
      replSet: {
        count: 2
      }
    }
  });
  vi.stubEnv('MONGODB_URI', (globalThis as any).__MONGO_URI__);
  // initGlobalVariables();
  await connectMongo(connectionMongo, MONGO_URL);
  await connectMongo(connectionLogMongo, MONGO_LOG_URL);

  // const str = readFileSync('projects/app/.env.local', 'utf-8');
  // const lines = str.split('\n');
  // const systemEnv: Record<string, string> = {};
  // for (const line of lines) {
  //   const [key, value] = line.split('=');
  //   if (key && value && !key.startsWith('#')) {
  //     systemEnv[key] = value;
  //     vi.stubEnv(key, value);
  //   }
  // }
  // systemEnv.oneapiUrl = systemEnv['ONEAPI_URL'];
  // global.systemEnv = systemEnv as any;
  // await setupModels()l
});

afterAll(async () => {
  await teardown();
});

afterEach(async () => {
  // clean the database
  await mongoose.connection.dropDatabase();
});
