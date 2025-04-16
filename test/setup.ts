import { connectionLogMongo, connectionMongo, Mongoose } from '@fastgpt/service/common/mongo';
import { connectMongo } from '@fastgpt/service/common/mongo/init';
import { afterAll, beforeAll, beforeEach, vi, inject, onTestFinished } from 'vitest';
import '@test/mocks';
import { clean } from '../FastGPT/test/datas/users';
import { randomUUID } from 'crypto';
import { delay } from '@fastgpt/global/common/system/utils';

vi.stubEnv('NODE_ENV', 'test');

vi.mock(import('@fastgpt/service/common/mongo/init'), async (importOriginal: any) => {
  const mod = await importOriginal();
  return {
    ...mod,
    connectMongo: async (db: Mongoose, url: string) => {
      await db.connect(url, { dbName: randomUUID() });
      await db.connection.db?.dropDatabase();
    }
  };
});

beforeAll(async () => {
  vi.stubEnv('MONGODB_URI', inject('MONGODB_URI'));
  await connectMongo(connectionMongo, inject('MONGODB_URI'));
  await connectMongo(connectionLogMongo, inject('MONGODB_URI'));
});

afterAll(async () => {
  if (connectionMongo?.connection) connectionMongo?.connection.close();
  if (connectionLogMongo?.connection) connectionLogMongo?.connection.close();
});

beforeEach(async () => {
  await connectMongo(connectionMongo, inject('MONGODB_URI'));
  await connectMongo(connectionLogMongo, inject('MONGODB_URI'));
  onTestFinished(async () => {
    clean();
    await delay(200); // wait for asynchronous operations to complete
    await Promise.all([
      connectionMongo?.connection.db?.dropDatabase(),
      connectionLogMongo?.connection.db?.dropDatabase()
    ]);
  });
});

declare module 'vitest' {
  export interface ProvidedContext {
    MONGODB_URI: string;
  }
}
