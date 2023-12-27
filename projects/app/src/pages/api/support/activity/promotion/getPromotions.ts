import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { MongoPromotionRecord } from '@fastgpt/service/support/activity/promotion/schema';
import { formatPriceStore2Read } from '@fastgpt/global/support/wallet/bill/tools';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    let { pageNum = 1, pageSize = 10 } = req.body as {
      pageNum: number;
      pageSize: number;
    };

    const { userId } = await authCert({ req, authToken: true });

    const [data, total] = await Promise.all([
      MongoPromotionRecord.find(
        {
          userId
        },
        '_id createTime type amount'
      )
        .sort({ _id: -1 })
        .skip((pageNum - 1) * pageSize)
        .limit(pageSize),
      MongoPromotionRecord.countDocuments({
        userId
      })
    ]);

    jsonRes(res, {
      data: {
        pageNum,
        pageSize,
        data: data.map((item) => ({
          ...item.toObject(),
          amount: formatPriceStore2Read(item.amount)
        })),
        total
      }
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
