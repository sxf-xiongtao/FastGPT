import type { Agent } from 'http';
import type { Pool } from 'pg';
import type { ConcatBillQueueItemType } from '@/global/support/wallet/bill/type.d';
import {
  FastGPTConfigFileType,
  FastGPTFeConfigsType,
  SystemEnvType
} from '@fastgpt/global/common/system/types';
import { SSOEnum } from '@/global/user/auth/constants';

export type PagingData<T = never> = {
  pageNum: number;
  pageSize: number;
  data: T[];
  total?: number;
};

export type PagingParams<T = Record<string, any>> = {
  pageNum: number;
  pageSize: number;
} & T;

export type RequestPaging = { pageNum: number; pageSize: number; [key]: any };

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
  };
  fastLogin?: Record<
    string,
    {
      authUrl: string;
    }
  >;
  sso?: `${SSOEnum}`;
};

export type LicenseDataType = {
  startTime: string;
  expTime: string;
  company: string;
  maxRegister: number;
};

declare global {
  var systemConfig: SystemConfigType;

  var store: Record<string, any>;
  var licenseData: LicenseDataType;

  var sendInformQueue: (() => Promise<void>)[];
  var sendInformQueueLen: number;

  var reduceAiPointsQueue: { teamId: string; totalPoints: number }[];
  var concatBillQueue: ConcatBillQueueItemType[];

  var autoTrainingLen: number;
}
