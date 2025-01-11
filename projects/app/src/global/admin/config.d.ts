import { NavbarItemType } from '@/pages/settings/config/components/FormField/NavbarItems';
import { SystemConfigType } from '@/types';
import { SystemConfigsTypeEnum } from '@fastgpt/global/common/system/config/constants';
import {
  FastGPTConfigFileType,
  ExternalProviderWorkflowVarType
} from '@fastgpt/global/common/system/types';
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
      show_openai_account: boolean;
      show_promotion: boolean;
      favicon: string;
      docUrl: string;
      systemPluginCourseUrl: string;
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
      autoLogin?: boolean;
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
    navbar?: NavbarItemType[];
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
    dingtalk: NonNullable<SystemConfigType['auth']>['dingtalk'];
    google: NonNullable<SystemConfigType['auth']>['google'];
    microsoft: NonNullable<SystemConfigType['auth']>['microsoft'];
    wecom: NonNullable<SystemConfigType['auth']>['wecom'];
    fastLogin: string;
  };
  paySettings: {
    wx: NonNullable<SystemConfigType['pay']>['wx'];
    subPlans: {
      planDescriptionUrl: string;
      [SubTypeEnum.standard]: string;
      extraDatasetSizePrice: number;
      extraPointsPrice: number;
    };
  };
  securitySettings: {
    censor?: SystemConfigType['censor'];
  };
  externalProviderSettings: {
    externalProviderWorkflowVariables: ExternalProviderWorkflowVarType[];
  };
};
