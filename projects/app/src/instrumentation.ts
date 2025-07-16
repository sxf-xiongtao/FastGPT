import { exit } from 'process';

export async function register() {
  try {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
      const [
        { connectMongo },
        { connectionMongo, connectionLogMongo, MONGO_URL, MONGO_LOG_URL },
        { initGlobalVariables, getProInitData },
        { loadSystemModels },
        { startCron },
        { concatBillTimer, reduceAiPointsTimer },
        { authLicense },
        { startTrainingProcess },
        { startMongoWatch },
        { initBullMQWorkers },
        { preLoadWorker },
        { connectSignoz }
      ] = await Promise.all([
        import('@fastgpt/service/common/mongo/init'),
        import('@fastgpt/service/common/mongo/index'),
        import('@/service/init'),
        import('@fastgpt/service/core/ai/config/utils'),
        import('@/service/common/system/cron'),
        import('@/service/support/wallet/controller'),
        import('@/service/common/license/auth'),
        import('@/service/core/dataset/training/utils'),
        import('@/service/middleware/volumnMongoWatch'),
        import('@/service/common/bullmq/index'),
        import('@fastgpt/service/worker/preload'),
        import('@fastgpt/service/common/otel/trace/register')
      ]);

      connectSignoz();
      initGlobalVariables();

      // Preload worker
      try {
        await preLoadWorker();
      } catch (error) {
        console.error('Preload worker error', error);
      }

      // Connect DB
      await Promise.all([connectMongo(connectionMongo, MONGO_URL), initBullMQWorkers()]);
      connectMongo(connectionLogMongo, MONGO_LOG_URL);

      // Start cron and timer
      startCron();
      reduceAiPointsTimer();
      concatBillTimer();

      // License checker
      try {
        global.licenseData = await authLicense();
      } catch (error) {
        console.log('Init system error', error);
      }

      // Init system from local or db
      await Promise.all([getProInitData(), loadSystemModels()]);

      startTrainingProcess(true);
      startMongoWatch();

      console.log('Init system success');
    }
  } catch (error) {
    console.log('Init system error', error);
    exit(1);
  }
}
