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
import { CreateBillProps, CreateBillResponse } from '@fastgpt/global/support/wallet/bill/api';
import { MongoTeam } from '@fastgpt/service/support/user/team/teamSchema';
import { getNanoid } from '@fastgpt/global/common/string/tools';

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
    } = req.body as CreateBillProps;

    if (!billTypeMap[type]) {
      throw new Error('Invalid type');
    }
    if (month && (month < 1 || month > 12 || month % 1 !== 0)) {
      throw new Error('Invalid month');
    }

    const { teamId, tmbId } = await authCert({ req, authToken: true });

    // get team balance
    const team = await MongoTeam.findById(teamId).lean();
    if (!team) {
      throw new Error('Team not found');
    }

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
      if (type === BillTypeEnum.extraPoints && extraPoints) {
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

      return {
        readPrice: 0
      };
    })();

    if (readPrice <= 0) {
      throw new Error('Invalid amount');
    }

    const storePrice = readPrice * PRICE_SCALE;
    const orderId = getNanoid(24);

    // const wxPay = new WXPay();
    // const { code_url } = await wxPay.getPayQRUrl({
    //   amount: readPrice,
    //   type,
    //   orderId
    // });

    // add one pay record
    const bill = await MongoBill.create({
      teamId,
      tmbId,
      orderId,
      price: storePrice,
      status: BillStatusEnum.SUCCESS,
      type,
      metadata: {
        payWay: 'wx',
        ...metadata
      }
    });

    jsonRes<CreateBillResponse>(res, {
      // data: {
      //   billId: bill._id,
      //   readPrice
      //   // codeUrl: code_url
      // }
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
