import { SystemConfigType } from '@/types';
import { SystemConfigsTypeEnum } from '@fastgpt/global/common/system/config/constants';
import { FastGPTConfigFileType } from '@fastgpt/global/common/system/types';
import { delay } from '@fastgpt/global/common/system/utils';
import { DatasetStatusEnum } from '@fastgpt/global/core/dataset/constants';
import { MongoSystemConfigs } from '@fastgpt/service/common/system/config/schema';
import { initFastGPTConfig } from '@fastgpt/service/common/system/tools';
import { MongoDataset } from '@fastgpt/service/core/dataset/schema';

export const getProInitData = async () => {
  try {
    const [fastgptConfig, fastgptProConfig] = await Promise.all([
      MongoSystemConfigs.findOne({
        type: SystemConfigsTypeEnum.fastgpt
      }).sort({
        createTime: -1
      }),
      MongoSystemConfigs.findOne({
        type: SystemConfigsTypeEnum.fastgptPro
      }).sort({
        createTime: -1
      })
    ]);

    // concat config
    const config: SystemConfigType = fastgptProConfig?.value
      ? (fastgptProConfig?.value as SystemConfigType)
      : {};

    global.systemConfig = config;

    initFastGPTConfig(fastgptConfig?.value as unknown as FastGPTConfigFileType);

    console.log({
      feConfigs: global.feConfigs,
      systemEnv: global.systemEnv,
      subPlans: global.subPlans,
      llmModels: global.llmModels,
      vectorModels: global.vectorModels,
      reRankModels: global.reRankModels,
      audioSpeechModels: global.audioSpeechModels,
      whisperModel: global.whisperModel
    });
    console.log(global.systemConfig);
  } catch (error) {
    console.log('init config error', error);
  }
};

export function initGlobalVariables() {
  global.sendInformQueue = [];
  global.sendInformQueueLen = 0;

  global.store = {};

  global.reduceAiPointsQueue = [];
  global.concatBillQueue = [];

  global.autoTrainingLen = 0;
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
