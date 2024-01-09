import { initDatasetStatus, initGlobal, initProServiceData } from './init';
import { authLicense } from './core/license';
import { exit } from 'process';
import { connectMongo } from '@fastgpt/service/common/mongo/init';
import { concatBillTimer, reduceTeamBalanceTimer } from './support/wallet/controller';

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
        await initProServiceData();
        await authLicense();

        initDatasetStatus();

        reduceTeamBalanceTimer();
        concatBillTimer();
      } catch (error) {
        console.log(error);
        return exit(1);
      }
    }
  });
}
