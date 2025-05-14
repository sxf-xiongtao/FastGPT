import { MongoSystemConfigs } from '@fastgpt/service/common/system/config/schema';
import { getProInitData } from '../init';
import { MongoSystemPlugin } from '@fastgpt/service/core/app/plugin/systemPluginSchema';
import { getSystemPluginCb } from '../core/workflow/systemPlugins/register';
import { debounce } from 'lodash';
import { watchSystemModelUpdate } from '@fastgpt/service/core/ai/config/utils';
import { createDatasetTrainingMongoWatch } from '../core/dataset/training/utils';
import { SystemConfigsTypeEnum } from '@fastgpt/global/common/system/config/constants';
import { authLicense } from '../common/license/auth';

export const startMongoWatch = async () => {
  reloadSystemConfigWatch();
  refetchSystemPlugins();
  createDatasetTrainingMongoWatch();
  watchSystemModelUpdate();
};

const reloadSystemConfigWatch = () => {
  const changeStream = MongoSystemConfigs.watch();

  changeStream.on('change', async (change) => {
    try {
      if (
        change.operationType === 'insert' &&
        change.fullDocument.type === SystemConfigsTypeEnum.fastgptPro
      ) {
        await getProInitData();
        console.log('refresh system config');
      }
      if (
        change.operationType === 'update' &&
        change?.updateDescription?.updatedFields?.value?.license
      ) {
        global.licenseData = await authLicense();
        console.log('Refresh license');
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
