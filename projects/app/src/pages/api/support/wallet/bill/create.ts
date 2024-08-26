import type { NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { MongoBill } from '@/service/support/wallet/bill/schema';
import { PRICE_SCALE } from '@fastgpt/global/support/wallet/constants';
import { WXPay } from '@/service/support/wallet/bill/pay';
import {
  BillStatusEnum,
  BillTypeEnum,
  SUB_DATASET_SIZE_RATE,
  SUB_EXTRA_POINT_RATE,
  billTypeMap
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

/* 获取支付二维码 */
async function handler(req: ApiRequestProps<CreateBillProps>, res: NextApiResponse) {
  const { type } = req.body;

  if (!billTypeMap[type]) {
    throw new Error('Invalid type');
  }

  const { teamId, tmbId } = await authUserPer({
    req,
    authToken: true,
    per: ManagePermissionVal
  });

  // amount: read price
  const { readPrice, metadata = {} } = (() => {
    if (type === BillTypeEnum.standSubPlan) {
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
    if (type === BillTypeEnum.extraDatasetSub) {
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
    if (type === BillTypeEnum.extraPoints) {
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

    throw new Error('Invalid bill type');
  })();

  if (readPrice <= 0) {
    throw new Error('Invalid amount');
  }

  const storePrice = readPrice * PRICE_SCALE;
  const orderId = getNanoid(24);

  const wxPay = new WXPay();
  const { code_url } = await wxPay.getPayQRUrl({
    amount: readPrice,
    type,
    orderId
  });

  // add one pay record
  const bill = await MongoBill.create({
    teamId,
    tmbId,
    orderId,
    price: storePrice,
    status: BillStatusEnum.NOTPAY,
    type,
    metadata: {
      payWay: 'wx',
      ...metadata
    }
  });

  jsonRes<CreateBillResponse>(res, {
    data: {
      billId: bill._id,
      readPrice,
      codeUrl: code_url
    }
  });
}

export default NextAPI(handler);
