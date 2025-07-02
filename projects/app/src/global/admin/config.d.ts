import type { NavbarItemType } from '@/pages/settings/config/components/FormField/NavbarItems';
import type { SystemConfigType } from '@/types';
import type { SystemConfigsTypeEnum } from '@fastgpt/global/common/system/config/constants';
import type {
  FastGPTConfigFileType,
  ExternalProviderWorkflowVarType,
  customPdfParseType
} from '@fastgpt/global/common/system/types';
import type { TeamModeEnum } from '../settings/constants';

export type ConfigStoreType = {
  [SystemConfigsTypeEnum.fastgpt]: FastGPTConfigFileType;
  [SystemConfigsTypeEnum.fastgptPro]: SystemConfigType;
};

export type ConfigFormType = {
  siteSettings: {
    feConfigs: {
      show_workorder: boolean;
      appTemplateCourse: string;
      show_emptyChat: boolean;
      show_team_chat: boolean;
      show_openai_account: boolean;
      show_compliance_copywriting: boolean;
      show_promotion: boolean;
      show_dataset_feishu: boolean;
      show_dataset_yuque: boolean;
      show_publish_feishu: boolean;
      show_publish_dingtalk: boolean;
      show_publish_offiaccount: boolean;
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
      mcpServerProxyEndpoint: string;
    };
    concatMd: string;
    scripts?: string;
    limit?: FastGPTConfigFileType['feConfigs']['limit'];
    systemEnv: {
      oneapiUrl?: string;
      chatApiKey: string;
      openapiPrefix: string;
      vectorMaxProcess: number;
      qaMaxProcess: number;
      vlmMaxProcess: number;
      hnswEfSearch: number;
      hnswMaxScanTuples: number;
      tokenWorkers: number;
      customPdfParse?: customPdfParseType;
    };
    navbar?: NavbarItemType[];
  };
  loginSettings: {
    email: NonNullable<SystemConfigType['auth']>['email'];
    phone: NonNullable<SystemConfigType['auth']>['phone'];
    sms: NonNullable<SystemConfigType['auth']>['sms'];
    github: NonNullable<SystemConfigType['auth']>['github'];
    wechat: NonNullable<SystemConfigType['auth']>['wechat'];
    google: NonNullable<SystemConfigType['auth']>['google'];
    microsoft: NonNullable<SystemConfigType['auth']>['microsoft'];
    fastLogin: string;
    teamMode?: `${TeamModeEnum}`;
    sso?: {
      title?: string;
      icon?: string;
      url?: string;
      autoLogin?: boolean;
    };
  };
  paySettings: {
    wx: NonNullable<SystemConfigType['pay']>['wx'];
    alipay: NonNullable<SystemConfigType['pay']>['alipay'];
    bank: NonNullable<SystemConfigType['pay']>['bank'];
    subPlans: {
      planDescriptionUrl: string;
      standard: string;
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
