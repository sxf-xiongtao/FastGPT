import { MongoSystemConfigs } from '@fastgpt/service/common/system/config/schema';
import { getProInitData } from '../init';
import { MongoSystemPlugin } from '@fastgpt/service/core/app/plugin/systemPluginSchema';
import { getSystemPluginCb } from '../core/workflow/systemPlugins/register';
import { debounce } from 'lodash';
import { watchSystemModelUpdate } from '@fastgpt/service/core/ai/config/utils';
import { createDatasetTrainingMongoWatch } from '../core/dataset/training/utils';

export const startMongoWatch = async () => {
  reloadConfigWatch();
  refetchSystemPlugins();
  createDatasetTrainingMongoWatch();
  watchSystemModelUpdate();
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
  const changeStream = MongoSystemPlugin.watch();

  changeStream.on(
    'change',
    debounce(async (change) => {
      try {
        console.log('refresh system plugins');
        getSystemPluginCb(true);
      } catch (error) {}
    }, 500)
  );
};
