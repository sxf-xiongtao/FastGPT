import { connectMongo } from '@fastgpt/service/common/mongo/init';

/**
 * connect MongoDB and init data
 */
export async function connectToDatabase(): Promise<void> {
  await connectMongo();
}
