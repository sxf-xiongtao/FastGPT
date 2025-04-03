import { exit } from 'process';

export async function register() {
  try {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
      const [
        { connectMongo },
        { connectionMongo, connectionLogMongo, MONGO_URL, MONGO_LOG_URL },
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
        import('@fastgpt/service/common/mongo/index'),
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

      // Connect to MongoDB
      await Promise.all([connectMongo(connectionMongo, MONGO_URL), initBullMQWorkers()]);
      connectMongo(connectionLogMongo, MONGO_LOG_URL);

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
