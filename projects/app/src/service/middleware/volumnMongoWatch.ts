import { MongoSystemConfigs } from '@fastgpt/service/common/system/config/schema';
import { getProInitData } from '../init';

export const startMongoWatch = async () => {
  reloadConfigWatch();
};

const reloadConfigWatch = () => {
  const changeStream = MongoSystemConfigs.watch();

  changeStream.on('change', async (change) => {
    try {
      if (change.operationType === 'insert') {
        await getProInitData();
        console.log('refresh system config');
      }
    } catch (error) {}
  });
};
