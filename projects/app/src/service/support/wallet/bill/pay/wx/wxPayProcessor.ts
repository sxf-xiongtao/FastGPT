import { BillStatusEnum } from '@fastgpt/global/support/wallet/bill/constants';
import { getPaymentDescription } from '../constants';
import { WxPayConfig, CreatePayOrderParams, PayController, PayResult } from '../type';
import { Payment } from './wxPayment';
import { CreateOrderResponse } from '@fastgpt/global/support/wallet/bill/api';
import { addLog } from '@fastgpt/service/common/system/log';

export const createWxPayProcessor = async (
  config: WxPayConfig,
  systemTitle: string
): Promise<PayController> => {
  const instance = new Payment({
    appid: config.WX_APPID,
    mchid: config.WX_MCHID,
    private_key: config.WX_PRIVATE_KEY,
    serial_no: config.WX_SERIAL_NO,
    apiv3_private_key: config.WX_V3_CODE,
    notify_url: config?.WX_NOTIFY_URL
  });
  await instance.init();

  return {
    createPayOrder: async (params: CreatePayOrderParams): Promise<CreateOrderResponse> => {
      const description = getPaymentDescription(params.type, systemTitle);

      const res = await instance.native({
        description,
        out_trade_no: params.orderId,
        amount: { total: params.amount * 100 }
      });

      const data = JSON.parse(res.data);

      if (!data.code_url) {
        return Promise.reject(data.message || 'Failed to retrieve payment QR code');
      }
      return { qrCode: data.code_url };
    },

    getPayResult: async (payId: string): Promise<PayResult> => {
      try {
        const res = await instance.getTransactionsByOutTradeNo({
          out_trade_no: payId
        });
        const data = JSON.parse(res.data) as {
          trade_state: 'SUCCESS' | 'CLOSED' | 'NOTPAY';
          trade_state_desc: string;
        };

        const status = (() => {
          if (data.trade_state === 'SUCCESS') {
            return BillStatusEnum.SUCCESS;
          }
          if (data.trade_state === 'CLOSED') {
            return BillStatusEnum.CLOSED;
          }
          return BillStatusEnum.NOTPAY;
        })();

        return {
          status,
          description: data.trade_state_desc
        };
      } catch (error) {
        addLog.warn('wxPay processor error');
        console.log(error);
        return {
          status: BillStatusEnum.NOTPAY,
          description: 'Request failed'
        };
      }
    }
  };
};
