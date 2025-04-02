import { exit } from 'process';

export async function register() {
  try {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
      const [
        { connectMongo },
        { initGlobalVariables, getProInitData },
        { startCron },
        { concatBillTimer, reduceAiPointsTimer },
        { authLicense },
        { getSystemPluginCb },
        { startTrainingProcess },
        { startMongoWatch },
        { initBullMQWorkers }
      ] = await Promise.all([
        import('@fastgpt/service/common/mongo/init'),
        import('@/service/init'),
        import('@/service/common/system/cron'),
        import('@/service/support/wallet/controller'),
        import('@/service/core/license'),
        import('@/service/core/workflow/systemPlugins/register'),
        import('@/service/core/dataset/training/utils'),
        import('@/service/middleware/volumnMongoWatch'),
        import('@/service/common/bullmq/index')
      ]);

      initGlobalVariables();

      await connectMongo();
      initBullMQWorkers();

      // Start cron and timer
      startCron();
      reduceAiPointsTimer();
      concatBillTimer();

      await Promise.all([getProInitData(), authLicense(), getSystemPluginCb(true)]);

      startTrainingProcess();
      startMongoWatch();

      console.log('Init system success');
    }
  } catch (error) {
    console.log('Init system error', error);
    exit(1);
  }
}
