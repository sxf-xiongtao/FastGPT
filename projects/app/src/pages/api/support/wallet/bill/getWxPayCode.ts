import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { connectToDatabase } from '@/service/mongo';
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
import { GetPayQRCodeResponse, GetPayQRCodeProps } from '@fastgpt/global/support/wallet/bill/api';

/* 获取支付二维码 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    const {
      type,
      balance,
      month,
      extraDatasetSize = 0,
      extraPoints = 0
    } = req.body as GetPayQRCodeProps;

    if (!billTypeMap[type]) {
      throw new Error('Invalid type');
    }
    if (month && (month < 1 || month > 12 || month % 1 !== 0)) {
      throw new Error('Invalid month');
    }

    const { teamId, tmbId } = await authCert({ req, authToken: true });

    // amount: read price
    const { readPrice, metadata = {} } = (() => {
      if (type === BillTypeEnum.balance && balance) {
        return {
          readPrice: balance
        };
      }
      if (type === BillTypeEnum.extraDatasetSub && month && extraDatasetSize) {
        const DatasetStorePrice = getExtraDatasetSizePrice('read');

        return {
          readPrice: extraDatasetSize * month * DatasetStorePrice,
          metadata: {
            month,
            datasetSize: extraDatasetSize * SUB_DATASET_SIZE_RATE
          }
        };
      }
      if (type === BillTypeEnum.extraPoints && month && extraPoints) {
        const pointsPrice = getExtraPointsPrice('read');

        return {
          readPrice: extraPoints * month * pointsPrice,
          metadata: {
            month,
            extraPoints: extraPoints * SUB_EXTRA_POINT_RATE
          }
        };
      }

      return {
        readPrice: 0
      };
    })();

    if (readPrice <= 0) {
      throw new Error('Invalid amount');
    }

    const wxPay = new WXPay();
    const { code_url, orderId } = await wxPay.getPayQRUrl(readPrice, type);

    const storePrice = readPrice * PRICE_SCALE;
    // add one pay record
    const payOrder = await MongoBill.create({
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

    jsonRes<GetPayQRCodeResponse>(res, {
      data: {
        readPrice,
        payId: String(payOrder._id),
        codeUrl: code_url
      }
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
