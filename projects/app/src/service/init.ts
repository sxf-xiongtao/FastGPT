import { SystemConfigsTypeEnum } from '@fastgpt/global/common/system/config/constants';
import { delay } from '@fastgpt/global/common/system/utils';
import { DatasetStatusEnum } from '@fastgpt/global/core/dataset/constant';
import { MongoSystemConfigs } from '@fastgpt/service/common/system/config/schema';
import { MongoDataset } from '@fastgpt/service/core/dataset/schema';
import { readFileSync } from 'fs';
import { exit } from 'process';

export const initService = async () => {
  global.store = {};
  try {
    const filename =
      process.env.NODE_ENV === 'development' ? 'data/config.local.json' : '/app/data/config.json';
    const res = JSON.parse(readFileSync(filename, 'utf-8'));

    const [dbConfig] = await Promise.all([
      MongoSystemConfigs.findOne({
        type: SystemConfigsTypeEnum.fastgptPro
      }).sort({
        createTime: -1
      })
    ]);
    console.log(res);

    global.systemConfig = res;
  } catch (error) {
    console.log('init config error', error);
    exit(1);
  }
};

export function initGlobal() {
  global.sendInformQueue = [];
  global.sendInformQueueLen = 0;
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
