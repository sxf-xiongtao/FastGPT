import { connectToDatabase } from '@/service/mongo';
import { adminCert } from '@/service/support/permission/adminCert';
import { PRICE_SCALE } from '@fastgpt/global/support/wallet/constants';
import { SubTypeEnum } from '@fastgpt/global/support/wallet/sub/constants';
import { jsonRes } from '@fastgpt/service/common/response';
import { MongoTeamSub } from '@fastgpt/service/support/wallet/sub/schema';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    await adminCert({ req, authToken: true });

    const {
      id,
      type,
      startTime,
      expiredTime,
      price,
      totalPoints,
      surplusPoints,
      extraDatasetSize,
      level
    } = req.body as {
      id: string;
      type: `${SubTypeEnum}`;
      startTime: Date;
      expiredTime: Date;
      price: number;
      totalPoints?: number;
      surplusPoints?: number;
      extraDatasetSize?: number;
      level?: number;
    };

    const sub = await MongoTeamSub.findById(id);
    if (!sub) {
      throw new Error('订阅不存在');
    }

    let result;
    if (type === SubTypeEnum.extraDatasetSize) {
      result = await MongoTeamSub.updateOne(
        {
          _id: id
        },
        {
          startTime,
          expiredTime,
          price: price * PRICE_SCALE,
          currentExtraDatasetSize: extraDatasetSize
        }
      );
    } else if (type === SubTypeEnum.extraPoints) {
      result = await MongoTeamSub.updateOne(
        {
          _id: id
        },
        {
          startTime,
          expiredTime,
          price: price * PRICE_SCALE,
          totalPoints,
          surplusPoints
        }
      );
    } else if (type === SubTypeEnum.standard) {
      result = await MongoTeamSub.updateOne(
        {
          _id: id
        },
        {
          startTime,
          expiredTime,
          price: price * PRICE_SCALE,
          currentSubLevel: level,
          totalPoints,
          surplusPoints
        }
      );
    }

    jsonRes(res, {
      data: {
        result
      }
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
