import { initDatasetStatus, initGlobal, initService } from './init';
import { authLicense } from '@/utils/service/common/license';
import { exit } from 'process';
import { connectMongo } from '@fastgpt/service/common/mongo/init';

/**
 * connect MongoDB and init data
 */
export async function connectToDatabase(): Promise<void> {
  await connectMongo({
    beforeHook: () => {
      initGlobal();
    },
    afterHook: async () => {
      try {
        await initService();
        await authLicense();
        initDatasetStatus();
      } catch (error) {
        console.log(error);
        return exit(1);
      }
    }
  });
}
