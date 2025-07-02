import type { NextApiResponse } from 'next';
import { MongoBill } from '@/service/support/wallet/bill/schema';
import {
  BillStatusEnum,
  BillPayWayEnum,
  MAX_WX_PAY_AMOUNT
} from '@fastgpt/global/support/wallet/bill/constants';
import type { ApiRequestProps } from '@fastgpt/service/type/next';
import type {
  CreateOrderResponse,
  UpdatePaymentProps
} from '@fastgpt/global/support/wallet/bill/api';
import { NextAPI } from '@/service/middleware/entry';
import { PRICE_SCALE } from '@fastgpt/global/support/wallet/constants';
import { createPaymentController } from '@/service/support/wallet/bill/pay/base';
import { i18nT } from '@fastgpt/web/i18n/utils';

async function handler(
  req: ApiRequestProps<UpdatePaymentProps>,
  res: NextApiResponse
): Promise<CreateOrderResponse> {
  const { billId, payWay: newPayway } = req.body;

  const bill = await MongoBill.findById(billId);
  if (!bill) {
    return Promise.reject('Bill not found');
  }
  if (bill.status !== BillStatusEnum.NOTPAY) {
    return Promise.reject('Bill not in NOTPAY status');
  }

  const payPrice = bill.price / PRICE_SCALE;

  const payWay = await (async () => {
    const hasWxPay = !!global.feConfigs?.payConfig?.wx;
    if (newPayway === BillPayWayEnum.wx && hasWxPay && payPrice < MAX_WX_PAY_AMOUNT) {
      return BillPayWayEnum.wx;
    }

    const hasAlipay = !!global.feConfigs?.payConfig?.alipay;
    if (newPayway === BillPayWayEnum.alipay && hasAlipay) {
      return BillPayWayEnum.alipay;
    }

    const hasBank = !!global.feConfigs?.payConfig?.bank;
    if (newPayway === BillPayWayEnum.bank && hasBank) {
      return BillPayWayEnum.bank;
    }

    if (hasWxPay) {
      return Promise.reject(i18nT('common:price_over_wx_limit'));
    }
    return Promise.reject(i18nT('common:no_pay_way'));
  })();

  const paymentProcessor = await createPaymentController(payWay);
  const { qrCode, iframeCode, markdown } = await paymentProcessor.createPayOrder({
    amount: payPrice,
    type: bill.type,
    orderId: bill.orderId
  });

  bill.metadata = { ...bill.metadata, payWay };
  await bill.save();

  return {
    qrCode,
    iframeCode,
    markdown
  };
}

export default NextAPI(handler);
