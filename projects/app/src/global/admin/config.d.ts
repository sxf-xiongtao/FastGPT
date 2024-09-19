import { SystemConfigType } from '@/types';
import { SystemConfigsTypeEnum } from '@fastgpt/global/common/system/config/constants';
import { FastGPTConfigFileType } from '@fastgpt/global/common/system/types';
import { SubTypeEnum } from '@fastgpt/global/support/wallet/sub/constants';

export type ConfigStoreType = {
  [SystemConfigsTypeEnum.fastgpt]: FastGPTConfigFileType;
  [SystemConfigsTypeEnum.fastgptPro]: SystemConfigType;
};

export type ConfigFormType = {
  siteSettings: {
    feConfigs: {
      show_emptyChat: boolean;
      show_team_chat: boolean;
      show_git: boolean;
      show_openai_account: boolean;
      show_promotion: boolean;
      favicon: string;
      docUrl: string;
      systemPluginCourseUrl: string;
      chatbotUrl: string;
      openAPIDocUrl: string;
      systemTitle: string;
      customApiDomain: string;
      customSharePageDomain: string;
      uploadFileMaxAmount: number;
      uploadFileMaxSize: number;
      lafEnv?: string;
    };
    sso?: {
      title?: string;
      icon?: string;
      url?: string;
    };
    concatMd: string;
    scripts?: string;
    limit?: FastGPTConfigFileType['feConfigs']['limit'];
    systemEnv: {
      openapiPrefix: string;
      vectorMaxProcess: number;
      qaMaxProcess: number;
      pgHNSWEfSearch: number;
      tokenWorkers: number;
    };
  };
  modelSettings: {
    llmModels: string;
    vectorModels: string;
    reRankModels: string;
    audioSpeechModels: string;
    whisperModel: string;
  };
  loginSettings: {
    email: NonNullable<SystemConfigType['auth']>['email'];
    phone: NonNullable<SystemConfigType['auth']>['phone'];
    sms: NonNullable<SystemConfigType['auth']>['sms'];
    github: NonNullable<SystemConfigType['auth']>['github'];
    wechat: NonNullable<SystemConfigType['auth']>['wechat'];
    google: NonNullable<SystemConfigType['auth']>['google'];
    fastLogin: string;
  };
  paySettings: {
    wx: NonNullable<SystemConfigType['pay']>['wx'];
    subPlans: {
      [SubTypeEnum.standard]: string;
      extraDatasetSizePrice: number;
      extraPointsPrice: number;
    };
  };
  securitySettings: {
    censor?: SystemConfigType['censor'];
  };
};
