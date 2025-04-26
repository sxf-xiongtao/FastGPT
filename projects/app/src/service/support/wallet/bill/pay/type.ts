import { CreateOrderResponse } from '@fastgpt/global/support/wallet/bill/api';
import { BillStatusEnum, BillTypeEnum } from '@fastgpt/global/support/wallet/bill/constants';

export type PayResult = {
  status: BillStatusEnum.SUCCESS | BillStatusEnum.NOTPAY | BillStatusEnum.CLOSED;
  description?: string;
};

export type CreatePayOrderParams = {
  amount: number;
  type: BillTypeEnum;
  orderId: string;
};

export type PayController = {
  createPayOrder: (params: CreatePayOrderParams) => Promise<CreateOrderResponse>;
  getPayResult: (payId: string) => Promise<PayResult>;
};

export type AlipayConfig = {
  APP_ID: string;
  ALIPAY_GATEWAY: string;
  APP_PRIVATE_KEY: string;
  ALIPAY_ROOT_CERT_CONTENT: string;
  ALIPAY_PUBLIC_CERT_CONTENT: string;
  APP_CERT_CONTENT: string;
  ALIPAY_ENDPOINT: string;
};

export type WxPayConfig = {
  WX_APPID: string;
  WX_MCHID: string;
  WX_PRIVATE_KEY: string;
  WX_SERIAL_NO: string;
  WX_V3_CODE: string;
  WX_NOTIFY_URL?: string;
};
