import { SystemConfigType } from '@/types';
import { SystemConfigsTypeEnum } from '@fastgpt/global/common/system/config/constants';
import { FastGPTConfigFileType } from '@fastgpt/global/common/system/types';
import { MongoSystemConfigs } from '@fastgpt/service/common/system/config/schema';
import { initFastGPTConfig } from '@fastgpt/service/common/system/tools';
import { loadSystemModels } from '@fastgpt/service/core/ai/config/utils';

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
      }),
      loadSystemModels()
    ]);

    // concat config
    const config: SystemConfigType = fastgptProConfig?.value
      ? (fastgptProConfig?.value as SystemConfigType)
      : {};
    global.systemConfig = config;

    const fastgptConfigValue = fastgptConfig?.value as unknown as FastGPTConfigFileType;
    if (fastgptConfigValue) {
      if (fastgptConfigValue.feConfigs) {
        fastgptConfigValue.feConfigs.isPlus = true;
      }
      initFastGPTConfig(fastgptConfigValue);
    }

    console.log({
      feConfigs: global.feConfigs,
      systemEnv: global.systemEnv,
      subPlans: global.subPlans,
      systemConfig: global.systemConfig
    });
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
  global.imageParseQueueLen = 0;
}
