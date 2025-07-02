import { MongoSystemConfigs } from '@fastgpt/service/common/system/config/schema';
import { getProInitData } from '../init';
import { watchSystemModelUpdate } from '@fastgpt/service/core/ai/config/utils';
import { createDatasetTrainingMongoWatch } from '../core/dataset/training/utils';
import { SystemConfigsTypeEnum } from '@fastgpt/global/common/system/config/constants';
import { authLicense } from '../common/license/auth';
import { refetchSystemPlugins } from '@fastgpt/service/core/app/plugin/controller';

export const startMongoWatch = async () => {
  reloadSystemConfigWatch();
  createDatasetTrainingMongoWatch();
  watchSystemModelUpdate();
  refetchSystemPlugins();
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
