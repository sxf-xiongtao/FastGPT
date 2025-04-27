import type { NextApiResponse } from 'next';
import { MongoBill } from '@/service/support/wallet/bill/schema';
import { PRICE_SCALE } from '@fastgpt/global/support/wallet/constants';
import {
  BillStatusEnum,
  BillTypeEnum,
  SUB_DATASET_SIZE_RATE,
  SUB_EXTRA_POINT_RATE,
  billTypeMap,
  MAX_WX_PAY_AMOUNT
} from '@fastgpt/global/support/wallet/bill/constants';
import { getExtraDatasetSizePrice, getExtraPointsPrice } from '@/service/support/wallet/sub/utils';
import { CreateBillProps, CreateBillResponse } from '@fastgpt/global/support/wallet/bill/api';
import { getNanoid } from '@fastgpt/global/common/string/tools';
import { NextAPI } from '@/service/middleware/entry';
import { ApiRequestProps } from '@fastgpt/service/type/next';
import { authUserPer } from '@fastgpt/service/support/permission/user/auth';
import { ManagePermissionVal } from '@fastgpt/global/support/permission/constant';
import { getStandardPlanConfig } from '@fastgpt/service/support/wallet/sub/utils';
import { subModeMap } from '@fastgpt/global/support/wallet/sub/constants';
import { BillPayWayEnum } from '@fastgpt/global/support/wallet/bill/constants';
import { createPaymentController } from '@/service/support/wallet/bill/pay/base';
import { i18nT } from '@fastgpt/web/i18n/utils';

/* 创建支付订单 */
async function handler(
  req: ApiRequestProps<CreateBillProps>,
  res: NextApiResponse
): Promise<CreateBillResponse> {
  const { type: billType } = req.body;

  if (!billTypeMap[billType]) {
    return Promise.reject('Invalid billType');
  }

  const { teamId, tmbId } = await authUserPer({
    req,
    authToken: true,
    per: ManagePermissionVal
  });

  // amount: read price
  const { readPrice, metadata = {} } = (() => {
    if (billType === BillTypeEnum.standSubPlan) {
      const { level, subMode } = req.body;
      const plan = getStandardPlanConfig(level);
      if (!plan) {
        throw new Error('Invalid plan');
      }

      // 订阅周期转成订阅了几个月
      const payMonth = subModeMap[subMode]?.payMonth;
      if (!payMonth) {
        throw new Error('Invalid subMode');
      }

      return {
        readPrice: payMonth * plan.price,
        metadata: {
          subMode,
          standSubLevel: level
        }
      };
    }
    if (billType === BillTypeEnum.extraDatasetSub) {
      const { month, extraDatasetSize } = req.body;

      if (!month || month < 1 || month > 12 || month % 1 !== 0) {
        throw new Error('Invalid month');
      }

      const DatasetStorePrice = getExtraDatasetSizePrice('read');

      return {
        readPrice: extraDatasetSize * month * DatasetStorePrice,
        metadata: {
          month,
          datasetSize: extraDatasetSize * SUB_DATASET_SIZE_RATE
        }
      };
    }
    if (billType === BillTypeEnum.extraPoints) {
      const { extraPoints } = req.body;

      const pointsPrice = getExtraPointsPrice('read');
      const month = 1;

      return {
        readPrice: extraPoints * month * pointsPrice,
        metadata: {
          month,
          extraPoints: extraPoints * SUB_EXTRA_POINT_RATE
        }
      };
    }

    throw new Error('Invalid bill billType');
  })();

  if (readPrice <= 0) {
    return Promise.reject('Invalid amount');
  }

  const storePrice = readPrice * PRICE_SCALE;

  // Get default pay way: wx - alipay
  const payWay = await (async () => {
    const hasWxPay = !!global.feConfigs?.payConfig?.wx;
    if (hasWxPay && readPrice < MAX_WX_PAY_AMOUNT) {
      return BillPayWayEnum.wx;
    }

    const hasAlipay = !!global.feConfigs?.payConfig?.alipay;
    if (hasAlipay) {
      return BillPayWayEnum.alipay;
    }

    const hasBank = !!global.feConfigs?.payConfig?.bank;
    if (hasBank) {
      return BillPayWayEnum.bank;
    }

    if (hasWxPay) {
      return Promise.reject(i18nT('common:price_over_wx_limit'));
    }
    return Promise.reject(i18nT('common:no_pay_way'));
  })();

  const orderId = getNanoid(24);

  const paymentProcessor = await createPaymentController(payWay);
  const paymentResult = await paymentProcessor.createPayOrder({
    amount: readPrice,
    type: billType,
    orderId
  });

  const bill = await MongoBill.create({
    teamId,
    tmbId,
    orderId,
    price: storePrice,
    status: BillStatusEnum.NOTPAY,
    type: billType,
    metadata: {
      payWay,
      ...metadata
    }
  });

  return {
    ...paymentResult,
    billId: bill._id,
    readPrice,
    payment: payWay
  };
}

export default NextAPI(handler);
