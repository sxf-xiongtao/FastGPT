import { initDatasetStatus, initGlobal, getProInitData } from './init';
import { authLicense } from './core/license';
import { exit } from 'process';
import { connectMongo } from '@fastgpt/service/common/mongo/init';
import { concatBillTimer, reduceAiPointsTimer } from './support/wallet/controller';
import { startCron } from './common/system/cron';
import { startTrainingProcess } from './core/dataset/training/utils';

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
        startCron();
        initDatasetStatus();

        reduceAiPointsTimer();
        concatBillTimer();

        startTrainingProcess();

        await getProInitData();
        await authLicense();
      } catch (error) {
        console.log(error);
        return exit(1);
      }
    }
  });
}
