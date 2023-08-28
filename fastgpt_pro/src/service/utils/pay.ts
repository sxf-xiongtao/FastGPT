// @ts-ignore
import Payment from 'wxpay-v3';
import { customAlphabet } from 'nanoid';
const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz1234567890', 20);

export class WXPay {
  getPayment() {
    try {
      return new Payment({
        appid: global.systemConfig?.pay?.wx?.WX_APPID,
        mchid: global.systemConfig?.pay?.wx?.WX_MCHID,
        private_key: global.systemConfig?.pay?.wx?.WX_PRIVATE_KEY,
        serial_no: global.systemConfig?.pay?.wx?.WX_SERIAL_NO,
        apiv3_private_key: global.systemConfig?.pay?.wx?.WX_V3_CODE,
        notify_url: global.systemConfig?.pay?.wx?.WX_NOTIFY_URL
      });
    } catch (error) {
      return Promise.reject(error);
    }
  }
  async nativePay(amount: number, payId: string) {
    try {
      const payment = await this.getPayment();
      const res = await payment.native({
        description: 'Fast GPT 余额充值',
        out_trade_no: payId,
        amount: {
          total: amount
        }
      });

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
  async getPayQRUrl(amount: number) {
    // 单位: 元
    if (!amount) {
      return Promise.reject('amount is error');
    }
    const id = nanoid();

    const code_url = await this.nativePay(amount * 100, id);

    return {
      code_url,
      orderId: id
    };
  }
}
