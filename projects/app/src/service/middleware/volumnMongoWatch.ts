import { MongoSystemConfigs } from '@fastgpt/service/common/system/config/schema';
import { getProInitData } from '../init';
import { MongoSystemPluginSchema } from '@fastgpt/service/core/app/plugin/systemPluginSchema';
import { getSystemPluginsAndLoadThem } from '../core/workflow/systemPlugins/register';

export const startMongoWatch = async () => {
  reloadConfigWatch();
  refetchSystemPlugins();
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

const refetchSystemPlugins = () => {
  const changeStream = MongoSystemPluginSchema.watch();

  changeStream.on('change', async (change) => {
    try {
      getSystemPluginsAndLoadThem(true);
    } catch (error) {}
  });
};
