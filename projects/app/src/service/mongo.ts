import { initService } from './init';
import { authLicense } from '@/utils/service/common/license';
import { exit } from 'process';
import { connectMongo } from '@fastgpt/common/mongo/init';

/**
 * connect MongoDB and init data
 */
export async function connectToDatabase(): Promise<void> {
  await connectMongo({
    beforeHook: () => {
      initService();
    },
    afterHook: async () => {
      try {
        await authLicense();
      } catch (error) {
        console.log(error);
        return exit(1);
      }
    }
  });
}
