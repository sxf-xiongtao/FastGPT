import { SystemConfigType } from '@/types';
import { SystemConfigsTypeEnum } from '@fastgpt/global/common/system/config/constants';
import { delay } from '@fastgpt/global/common/system/utils';
import { DatasetStatusEnum } from '@fastgpt/global/core/dataset/constant';
import { MongoSystemConfigs } from '@fastgpt/service/common/system/config/schema';
import { MongoDataset } from '@fastgpt/service/core/dataset/schema';

export const initProServiceData = async () => {
  try {
    const dbConfig = await MongoSystemConfigs.findOne({
      type: SystemConfigsTypeEnum.fastgptPro
    }).sort({
      createTime: -1
    });

    // concat config
    const config: SystemConfigType = dbConfig?.value
      ? (dbConfig?.value as SystemConfigType)
      : {
          system: {
            title: 'FastGPT'
          }
        };

    global.systemConfig = config;
    console.log(config);
  } catch (error) {
    console.log('init config error', error);
  }
};

export function initGlobal() {
  global.sendInformQueue = [];
  global.sendInformQueueLen = 0;
  global.reduceBalanceQueue = [];
  global.store = {};
}

export async function initDatasetStatus() {
  try {
    await MongoDataset.updateMany(
      { status: { $ne: DatasetStatusEnum.active } },
      { status: DatasetStatusEnum.active }
    );
  } catch (error) {
    await delay(100);
    initDatasetStatus();
  }
}
