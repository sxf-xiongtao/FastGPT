import type { Agent } from 'http';
import type { Pool } from 'pg';
import {
  FastGPTConfigFileType,
  FastGPTFeConfigsType,
  SystemEnvType
} from '@fastgpt/global/common/system/types';
import { TeamModeEnum } from '@/global/settings/constants';

export type SystemConfigType = {
  // license: string;
  censor?: {
    BAIDU_TEXT_CENSOR_CLIENTID?: string;
    BAIDU_TEXT_CENSOR_CLIENTSECRET?: string;
    customCensorURL?: string; // custom censor check url, which has higher priority than baidu
  };
  auth?: {
    googleServiceVerKey?: string;
    github?: {
      clientId: string;
      secret: string;
    };
    google?: {
      clientId: string;
      secret: string;
    };
    microsoft?: {
      clientId: string;
      secret: string;
      tenantId: string;
      customButton?: string;
    };
    email?: {
      smtp: string;
      user: string;
      pass: string;
      register: boolean;
    };
    sms: {
      REGISTER: string;
      RESET_PASSWORD: string;
      BIND_NOTIFICATION: string;
      EXPIRE_SOON: string;
      EXPIRED: string; // TODO: 0 day ?
      // LACK_OF_POINTS: string; // DO not post sms, because it's expensive
      FREE_CLEAN: string;
      FREE_CLEANED: string;
    };
    phone?: {
      SNED_PHONE_ACCESSKEYID: string;
      SNED_PHONE_ACCESSSECRET: string;
      SNED_PHONE_SIGNNAME: string;
      // SNED_PHONE_TEMPLATE: {};
    };
    wechat?: {
      appID: string;
      appSecret: string;
    };
    dingtalk?: {
      clientId: string;
      secret: string;
    };
    wecom?: {
      corpid: string;
      secret: string;
      agentid: string;
      syncSecret: string;
      isSync: boolean;
    };
  };
  pay?: {
    wx?: {
      WX_APPID?: string;
      WX_MCHID?: string;
      WX_SERIAL_NO?: string;
      WX_V3_CODE?: string;
      WX_NOTIFY_URL?: string;
      WX_PRIVATE_KEY?: string;
    };
    alipay?: {
      APP_ID?: string;
      APP_PRIVATE_KEY?: string;
      APP_CERT_CONTENT?: string;
      ALIPAY_GATEWAY?: string;
      ALIPAY_ROOT_CERT_CONTENT?: string;
      ALIPAY_PUBLIC_CERT_CONTENT?: string;
      ALIPAY_ENDPOINT?: string;
      ALIPAY_NOTIFY_URL?: string;
    };
    bank?: {
      description?: string;
    };
  };
  fastLogin?: Record<
    string,
    {
      authUrl: string;
    }
  >;
  teamMode?: `${TeamModeEnum}`;
};

declare global {
  var systemConfig: SystemConfigType;

  var store: Record<string, any>;

  var sendInformQueue: (() => Promise<void>)[];
  var sendInformQueueLen: number;

  var autoTrainingLen: number;
  var imageParseQueueLen: number;
}
