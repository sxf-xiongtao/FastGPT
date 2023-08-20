import type { Mongoose } from 'mongoose';
import type { Agent } from 'http';
import type { Pool } from 'pg';
import type { Logger } from 'winston';
import { ChatModelItemType, QAModelItemType, VectorModelItemType } from './model';

export type PagingData<T> = {
  pageNum: number;
  pageSize: number;
  data: T[];
  total?: number;
};

export type RequestPaging = { pageNum: number; pageSize: number; [key]: any };

export type SystemConfigType = {
  system: {
    title: string;
  };
  censor: {
    BAIDU_TEXT_CENSOR_CLIENTID: string;
    BAIDU_TEXT_CENSOR_CLIENTSECRET: string;
  };
  auth: {
    email: {
      service: string;
      user: string;
      pass: string;
    };
    phone: {
      SNED_PHONE_ACCESSKEYID: string;
      SNED_PHONE_ACCESSSECRET: string;
      SNED_PHONE_SIGNNAME: string;
      SNED_PHONE_TEMPLATE: string;
    };
  };
};

declare global {
  var mongodb: Mongoose | string | null;
  var pgClient: Pool | null;

  var logger: Logger;

  var systemConfig: SystemConfigType;
  var store: Record<string, any>;
}
