import type { Agent } from 'http';
import type { Pool } from 'pg';
import { ChatModelItemType, QAModelItemType, VectorModelItemType } from './model';

export type PagingData<T> = {
  pageNum: number;
  pageSize: number;
  data: T[];
  total?: number;
};

export type RequestPaging = { pageNum: number; pageSize: number; [key]: any };

export type SystemConfigType = {
  license: string;
  system: {
    title: string;
    userDefaultBalance?: number;
    teamDefaultMaxMember?: number;
  };
  censor?: {
    BAIDU_TEXT_CENSOR_CLIENTID?: string;
    BAIDU_TEXT_CENSOR_CLIENTSECRET?: string;
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
    email?: {
      service: string;
      user: string;
      pass: string;
    };
    phone?: {
      SNED_PHONE_ACCESSKEYID: string;
      SNED_PHONE_ACCESSSECRET: string;
      SNED_PHONE_SIGNNAME: string;
      SNED_PHONE_TEMPLATE: string;
    };
  };
  pay?: {
    wx?: {
      WX_APPID: string;
      WX_MCHID: string;
      WX_SERIAL_NO: string;
      WX_V3_CODE: string;
      WX_NOTIFY_URL: string;
      WX_PRIVATE_KEY: string;
    };
  };
};

export type LicenseDataType = {
  startTime: string;
  expTime: string;
  company: string;
  maxRegister: number;
};

declare global {
  var pgClient: Pool | null;

  var systemConfig: SystemConfigType;
  var store: Record<string, any>;
  var licenseData: LicenseDataType;
}
