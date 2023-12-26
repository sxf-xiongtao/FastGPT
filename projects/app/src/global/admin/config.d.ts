import { SystemConfigType } from '@/types';
import { SystemConfigsTypeEnum } from '@fastgpt/global/common/system/config/constants';
import { FastGPTConfigFileType } from '@fastgpt/global/common/system/types';

export type ConfigStoreType = {
  [SystemConfigsTypeEnum.fastgpt]: FastGPTConfigFileType;
  [SystemConfigsTypeEnum.fastgptPro]: SystemConfigType;
};

export type ConfigFormType = {
  [SystemConfigsTypeEnum.fastgpt]: {
    feConfigs: {
      switches: {
        show_emptyChat: boolean;
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
      limit?: FastGPTConfigFileType['feConfigs']['limit'];
    };
    models: {
      chatModels: string;
      qaModels: string;
      cqModels: string;
      extractModels: string;
      qgModels: string;
      vectorModels: string;
      reRankModels: string;
      audioSpeechModels: string;
      whisperModel: string;
    };
  };
  [SystemConfigsTypeEnum.fastgptPro]: {
    system: Omit<SystemConfigType['system'], 'title'>;
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
    };
    pay: SystemConfigType['pay'];
  };
};
