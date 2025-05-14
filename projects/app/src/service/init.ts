import { censorCheckRequest } from '@/pages/api/common/censor/check';
import {
  getProApiDatasetFileContentRequest,
  getProApiDatasetFileDetailRequest,
  getProApiDatasetFileListRequest,
  getProApiDatasetFilePreviewUrlRequest
} from '@/pages/api/core/dataset/systemApiDataset';
import { openapiAuthLimitRequest } from '@/pages/api/support/openapi/authLimit';
import { initFastGPTConfig } from '@fastgpt/service/common/system/tools';
import { deepRagSearch } from './core/dataset/search';
import { concatUsageRequest, createUsageRequest } from './support/wallet/usage/utils';
import { cloneDeep } from 'lodash';
import { beforeUpdateConfig } from './admin/settings/hooks';
import { getSystemConfig, updateSystemConfig } from './common/system/config';

export const getProInitData = async () => {
  try {
    let { fastgptConfig, fastgptProConfig } = await getSystemConfig();

    // 如果环境变量有变化，这里会重新计算一份最新配置
    if (fastgptConfig && fastgptProConfig) {
      const cloneFastGPTConfigValue = cloneDeep(fastgptConfig);
      const cloneFastGPTProConfig = cloneDeep(fastgptProConfig);

      beforeUpdateConfig(cloneFastGPTConfigValue, cloneFastGPTProConfig);
      if (
        JSON.stringify(fastgptConfig) !== JSON.stringify(cloneFastGPTConfigValue) ||
        JSON.stringify(fastgptProConfig) !== JSON.stringify(cloneFastGPTProConfig)
      ) {
        console.log('环境变量发生变化了，重新计算配置文件');
        await updateSystemConfig({
          fastgpt: cloneFastGPTConfigValue,
          fastgptPro: cloneFastGPTProConfig
        });
        fastgptConfig = cloneFastGPTConfigValue;
        fastgptProConfig = cloneFastGPTProConfig;
      } else {
        console.log('环境变量没有发生变化，不重新计算配置文件');
      }
    }

    // Add value to global
    global.systemConfig = fastgptProConfig;

    if (fastgptConfig) {
      if (fastgptConfig.feConfigs) {
        fastgptConfig.feConfigs.isPlus = true;
      }
      initFastGPTConfig(fastgptConfig);
    }

    console.log({
      fastgpt: fastgptConfig,
      fastgptPro: fastgptProConfig
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
    global.getProApiDatasetFileDetail = getProApiDatasetFileDetailRequest;
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
