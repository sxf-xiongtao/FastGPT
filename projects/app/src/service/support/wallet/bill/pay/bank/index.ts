import { BillStatusEnum } from '@fastgpt/global/support/wallet/bill/constants';
import { CreatePayOrderParams, PayController, PayResult } from '../type';
import { CreateOrderResponse } from '@fastgpt/global/support/wallet/bill/api';

export const createBankPayController = (
  config: {
    description?: string;
  },
  systemTitle: string
): PayController => {
  return {
    createPayOrder: async (params: CreatePayOrderParams): Promise<CreateOrderResponse> => {
      return {
        markdown: config.description
      };
    },
    getPayResult: async (payId: string): Promise<PayResult> => {
      return {
        status: BillStatusEnum.SUCCESS
      };
    },
    refund: async (params: { orderId: string; amount: number; refundId: string }): Promise<any> => {
      return Promise.reject('bankPay refund not supported');
    }
  };
};
