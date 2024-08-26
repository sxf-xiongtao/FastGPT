import { connectToDatabase } from '@/service/mongo';
import { adminCert } from '@/service/support/permission/adminCert';
import { PRICE_SCALE } from '@fastgpt/global/support/wallet/constants';
import { SubTypeEnum } from '@fastgpt/global/support/wallet/sub/constants';
import { jsonRes } from '@fastgpt/service/common/response';
import { MongoTeam } from '@fastgpt/service/support/user/team/teamSchema';
import { MongoTeamSub } from '@fastgpt/service/support/wallet/sub/schema';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    await adminCert({ req, authToken: true });

    const {
      teamId,
      type,
      startTime,
      expiredTime,
      price,
      extraDatasetSize,
      totalPoints,
      surplusPoints
    } = req.body as {
      teamId: string;
      type: `${SubTypeEnum}`;
      startTime: Date;
      expiredTime: Date;
      price: number;
      extraDatasetSize?: number;
      totalPoints?: number;
      surplusPoints?: number;
    };

    if (!teamId) {
      throw new Error('缺少字段');
    }

    const team = await MongoTeam.findById(teamId);
    if (!team) {
      throw new Error('团队不存在');
    }

    let result;
    if (type === SubTypeEnum.extraDatasetSize) {
      result = await MongoTeamSub.create({
        teamId,
        type,
        startTime,
        expiredTime,
        price: price * PRICE_SCALE,

        currentExtraDatasetSize: extraDatasetSize
      });
    } else if (type === SubTypeEnum.extraPoints) {
      result = await MongoTeamSub.create({
        teamId,
        type,
        startTime,
        expiredTime,
        price: price * PRICE_SCALE,

        totalPoints,
        surplusPoints
      });
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
