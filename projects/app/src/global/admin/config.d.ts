import { SystemConfigType } from '@/types';
import { SystemConfigsTypeEnum } from '@fastgpt/global/common/system/config/constants';
import { FastGPTConfigFileType } from '@fastgpt/global/common/system/types';
import { SubTypeEnum } from '@fastgpt/global/support/wallet/sub/constants';

export type ConfigStoreType = {
  [SystemConfigsTypeEnum.fastgpt]: FastGPTConfigFileType;
  [SystemConfigsTypeEnum.fastgptPro]: SystemConfigType;
};

export type ConfigFormType = {
  [SystemConfigsTypeEnum.fastgpt]: {
    feConfigs: {
      switches: {
        show_emptyChat: boolean;
        show_team_chat: boolean;
        show_git: boolean;
        show_openai_account: boolean;
        show_promotion: boolean;
      };
      images: {
        favicon: string;
      };
      concatMd: string;
      docUrl: string;
      chatbotUrl: string;
      openAPIDocUrl: string;
      systemTitle: string;
      customApiDomain: string;
      customSharePageDomain: string;
      limit?: FastGPTConfigFileType['feConfigs']['limit'];
      scripts?: string;
      uploadFileMaxAmount: number;
      uploadFileMaxSize: number;
      lafEnv?: string;
    };
    systemEnv: {
      openapiPrefix: string;
      vectorMaxProcess: number;
      qaMaxProcess: number;
      pgHNSWEfSearch: number;
    };
    subPlans: {
      standard: string;
      extraDatasetSizePrice: number;
      extraPointsPrice: number;
    };
    models: {
      llmModels: string;
      vectorModels: string;
      reRankModels: string;
      audioSpeechModels: string;
      whisperModel: string;
    };
  };
  [SystemConfigsTypeEnum.fastgptPro]: {
    censor: SystemConfigType['censor'];
    auth: {
      googleV3Ver: {
        clientKey: string;
        serviceKey: string;
      };
      github: SystemConfigType['auth']['github'];
      google: SystemConfigType['auth']['google'];
      email: SystemConfigType['auth']['email'];
      phone: SystemConfigType['auth']['phone'];
      wechat: SystemConfigType['auth']['wechat'];
    };
    pay: SystemConfigType['pay'];
    fastLogin: string;
  };
};
