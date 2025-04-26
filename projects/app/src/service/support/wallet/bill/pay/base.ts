import { BillPayWayEnum } from '@fastgpt/global/support/wallet/bill/constants';
import { createAlipayProcessor } from './alipay/alipayProcessor';
import { AlipayConfig, WxPayConfig, PayController } from './type';
import { createWxPayProcessor } from './wx/wxPayProcessor';
import { createBankPayController } from './bank';

export const createPaymentController = async (
  type: `${BillPayWayEnum}`
): Promise<PayController> => {
  const systemTitle = global.feConfigs.systemTitle || '';

  if (type === BillPayWayEnum.alipay && global.systemConfig?.pay?.alipay) {
    return createAlipayProcessor(global.systemConfig?.pay?.alipay as AlipayConfig, systemTitle);
  }

  if (type === BillPayWayEnum.wx && global.systemConfig?.pay?.wx) {
    return createWxPayProcessor(global.systemConfig?.pay?.wx as WxPayConfig, systemTitle);
  }

  if (type === BillPayWayEnum.bank && global.systemConfig?.pay?.bank) {
    return createBankPayController(
      {
        description: global.systemConfig?.pay?.bank?.description
      },
      systemTitle
    );
  }

  return Promise.reject(`Unsupported payment type: ${type}`);
};
