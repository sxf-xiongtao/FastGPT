import { BillTypeEnum } from '@fastgpt/global/support/wallet/bill/constants';
import { Payment } from './payment';
import { getNanoid } from '@fastgpt/global/common/string/tools';

export class WXPay {
  async getPayment() {
    try {
      const payment = new Payment({
        appid: global.systemConfig?.pay?.wx?.WX_APPID,
        mchid: global.systemConfig?.pay?.wx?.WX_MCHID,
        private_key: global.systemConfig?.pay?.wx?.WX_PRIVATE_KEY,
        serial_no: global.systemConfig?.pay?.wx?.WX_SERIAL_NO,
        apiv3_private_key: global.systemConfig?.pay?.wx?.WX_V3_CODE,
        notify_url: global.systemConfig?.pay?.wx?.WX_NOTIFY_URL
      });
      await payment.init();
      return payment;
    } catch (error) {
      return Promise.reject(error);
    }
  }
  async nativePay({
    amount,
    payId,
    type
  }: {
    amount: number;
    payId: string;
    type: `${BillTypeEnum}`;
  }) {
    const map = {
      [BillTypeEnum.balance]: '余额充值',
      [BillTypeEnum.standSubPlan]: '套餐订阅',
      [BillTypeEnum.extraDatasetSub]: '额外知识库存储',
      [BillTypeEnum.extraPoints]: '额外AI积分'
    };
    try {
      const payment = await this.getPayment();
      const res = await payment.native({
        description: `${global.systemConfig.system.title} ${map[type]}`,
        out_trade_no: payId,
        amount: {
          total: amount
        }
      });
      const data = JSON.parse(res.data);
      if (!data.code_url) {
        throw new Error(data.message || '获取支付二维码失败');
      }

      return JSON.parse(res.data).code_url as string;
    } catch (error) {
      return Promise.reject(error);
    }
  }
  async getPayResult(payId: string) {
    try {
      const payment = await this.getPayment();

      const res = await payment.getTransactionsByOutTradeNo({
        out_trade_no: payId
      });

      return JSON.parse(res.data);
    } catch (error) {
      return Promise.reject(error);
    }
  }
  async getPayQRUrl(amount: number, type: `${BillTypeEnum}`) {
    // 单位: 元
    if (!amount) {
      return Promise.reject('amount is error');
    }
    const id = getNanoid(24);

    const code_url = await this.nativePay({
      amount: amount * 100,
      payId: id,
      type
    });

    return {
      code_url,
      orderId: id
    };
  }
}
