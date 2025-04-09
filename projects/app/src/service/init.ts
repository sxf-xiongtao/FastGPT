import { censorCheckRequest } from '@/pages/api/common/censor/check';
import {
  getProApiDatasetFileContentRequest,
  getProApiDatasetFileListRequest,
  getProApiDatasetFilePreviewUrlRequest
} from '@/pages/api/core/dataset/systemApiDataset';
import { SystemConfigType } from '@/types';
import { SystemConfigsTypeEnum } from '@fastgpt/global/common/system/config/constants';
import { FastGPTConfigFileType } from '@fastgpt/global/common/system/types';
import { MongoSystemConfigs } from '@fastgpt/service/common/system/config/schema';
import { initFastGPTConfig } from '@fastgpt/service/common/system/tools';
import { loadSystemModels } from '@fastgpt/service/core/ai/config/utils';
import { deepRagSearch } from './core/dataset/search';
import { openapiAuthLimitRequest } from '@/pages/api/support/openapi/authLimit';
import { concatUsageRequest, createUsageRequest } from './support/wallet/usage/utils';

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
  function initPlusRequest() {
    global.textCensorHandler = censorCheckRequest;
    global.deepRagHandler = deepRagSearch;
    global.authOpenApiHandler = openapiAuthLimitRequest;
    global.createUsageHandler = createUsageRequest;
    global.concatUsageHandler = concatUsageRequest;

    global.getProApiDatasetFileList = getProApiDatasetFileListRequest;
    global.getProApiDatasetFileContent = getProApiDatasetFileContentRequest;
    global.getProApiDatasetFilePreviewUrl = getProApiDatasetFilePreviewUrlRequest;
  }

  global.sendInformQueue = [];
  global.sendInformQueueLen = 0;

  global.store = {};

  global.reduceAiPointsQueue = [];
  global.concatBillQueue = [];

  global.autoTrainingLen = 0;
  global.imageParseQueueLen = 0;

  initPlusRequest();
}
