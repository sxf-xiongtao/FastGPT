import { initDatasetStatus, initGlobal, getProInitData } from './init';
import { authLicense } from './core/license';
import { exit } from 'process';
import { connectMongo } from '@fastgpt/service/common/mongo/init';
import { concatBillTimer, reduceTeamBalanceTimer } from './support/wallet/controller';
import { startCron } from './common/system/cron';

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

        reduceTeamBalanceTimer();
        concatBillTimer();

        await getProInitData();
        await authLicense();
      } catch (error) {
        console.log(error);
        return exit(1);
      }
    }
  });
}
