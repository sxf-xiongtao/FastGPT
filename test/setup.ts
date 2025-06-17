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

// 完全 mock Redis 相关模块
vi.mock('@fastgpt/service/common/redis', () => ({
  newQueueRedisConnection: () => ({
    set: vi.fn().mockResolvedValue('OK'),
    get: vi.fn().mockResolvedValue(null),
    del: vi.fn().mockResolvedValue(1),
    exists: vi.fn().mockResolvedValue(0),
    incrbyfloat: vi.fn().mockResolvedValue(1),
    keys: vi.fn().mockResolvedValue([]),
    on: vi.fn()
  }),
  newWorkerRedisConnection: () => ({
    set: vi.fn().mockResolvedValue('OK'),
    get: vi.fn().mockResolvedValue(null),
    del: vi.fn().mockResolvedValue(1),
    exists: vi.fn().mockResolvedValue(0),
    incrbyfloat: vi.fn().mockResolvedValue(1),
    keys: vi.fn().mockResolvedValue([]),
    on: vi.fn()
  }),
  getGlobalRedisConnection: () => ({
    set: vi.fn().mockResolvedValue('OK'),
    get: vi.fn().mockResolvedValue(null),
    del: vi.fn().mockResolvedValue(1),
    exists: vi.fn().mockResolvedValue(0),
    incrbyfloat: vi.fn().mockResolvedValue(1),
    keys: vi.fn().mockResolvedValue([]),
    on: vi.fn()
  }),
  getAllKeysByPrefix: vi.fn().mockResolvedValue([]),
  FASTGPT_REDIS_PREFIX: 'fastgpt:'
}));
vi.mock('@fastgpt/service/common/redis/cache', () => ({
  CacheKeyEnum: {
    team_vector_count: 'team_vector_count',
    team_point_surplus: 'team_point_surplus',
    team_point_total: 'team_point_total'
  },
  CacheKeyEnumTime: {
    team_vector_count: 30 * 60,
    team_point_surplus: 1 * 60,
    team_point_total: 1 * 60
  },
  setRedisCache: vi.fn().mockResolvedValue(undefined),
  getRedisCache: vi.fn().mockResolvedValue(null),
  incrValueToCache: vi.fn().mockResolvedValue(undefined),
  delRedisCache: vi.fn().mockResolvedValue(undefined)
}));

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
