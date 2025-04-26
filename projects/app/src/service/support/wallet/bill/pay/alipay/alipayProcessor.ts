// src/payment/alipay.ts
import { BillStatusEnum, QR_CODE_SIZE } from '@fastgpt/global/support/wallet/bill/constants';
import { AlipaySdk } from 'alipay-sdk';
import { getPaymentDescription } from '../constants';
import { AlipayConfig, CreatePayOrderParams, PayController, PayResult } from '../type';
import { CreateOrderResponse } from '@fastgpt/global/support/wallet/bill/api';
import { addLog } from '@fastgpt/service/common/system/log';

export const createAlipayProcessor = (config: AlipayConfig, systemTitle: string): PayController => {
  const instance = new AlipaySdk({
    appId: config.APP_ID,
    gateway: config.ALIPAY_GATEWAY,
    privateKey: config.APP_PRIVATE_KEY,
    alipayRootCertContent: config.ALIPAY_ROOT_CERT_CONTENT,
    alipayPublicCertContent: config.ALIPAY_PUBLIC_CERT_CONTENT,
    appCertContent: config.APP_CERT_CONTENT,
    endpoint: config.ALIPAY_ENDPOINT
  });

  return {
    createPayOrder: async (params: CreatePayOrderParams): Promise<CreateOrderResponse> => {
      const description = getPaymentDescription(params.type, systemTitle);

      const res = instance.pageExec('alipay.trade.page.pay', {
        bizContent: {
          out_trade_no: params.orderId,
          total_amount: params.amount,
          subject: description,
          product_code: 'FAST_INSTANT_TRADE_PAY',
          qr_pay_mode: '4',
          qrcode_width: QR_CODE_SIZE
        }
      });

      return { iframeCode: res };
    },

    getPayResult: async (payId: string): Promise<PayResult> => {
      try {
        const res = await instance.exec('alipay.trade.query', {
          bizContent: { out_trade_no: payId }
        });

        if (res.code !== '10000') {
          addLog.warn('Alipay processor error');
          console.log(res);
        }

        const status = (() => {
          if (res.tradeStatus === 'TRADE_SUCCESS') {
            return BillStatusEnum.SUCCESS;
          }
          if (res.tradeStatus === 'TRADE_CLOSED') {
            return BillStatusEnum.CLOSED;
          }
          return BillStatusEnum.NOTPAY;
        })();

        return {
          status,
          description: res.msg
        };
      } catch (error) {
        addLog.warn('Alipay processor error');
        console.log(error);
        return {
          status: BillStatusEnum.NOTPAY,
          description: 'Request failed'
        };
      }
    }
  };
};
