import { initDatasetStatus, initGlobal, getProInitData } from './init';
import { authLicense } from './core/license';
import { exit } from 'process';
import { connectMongo } from '@fastgpt/service/common/mongo/init';
import { concatBillTimer, reduceAiPointsTimer } from './support/wallet/controller';
import { startCron } from './common/system/cron';
import { startTrainingProcess } from './core/dataset/training/utils';
import { addLog } from '@fastgpt/service/common/system/log';
import { startMongoWatch } from './middleware/volumnMongoWatch';

/**
 * connect MongoDB and init data
 */
export async function connectToDatabase(): Promise<void> {
  if (!global.systemLoadedGlobalVariables) {
    global.systemLoadedGlobalVariables = true;
    initGlobal();
  }

  await connectMongo().then(async () => {
    if (global.systemLoadedGlobalConfig) return;
    global.systemLoadedGlobalConfig = true;

    try {
      startCron();
      reduceAiPointsTimer();
      concatBillTimer();

      initDatasetStatus();

      await Promise.all([getProInitData(), authLicense()]);

      startTrainingProcess();
      startMongoWatch();
    } catch (error) {
      addLog.error('init error', error);
      exit(1);
    }
  });
}
