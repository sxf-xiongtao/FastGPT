import { reComputeStandPlans } from '@/service/support/wallet/sub/controller';
import { NextAPI } from '@/service/middleware/entry';

import { adminCert } from '@/service/support/permission/adminCert';
import { PRICE_SCALE } from '@fastgpt/global/support/wallet/constants';
import { SubTypeEnum } from '@fastgpt/global/support/wallet/sub/constants';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import { jsonRes } from '@fastgpt/service/common/response';
import { MongoTeamSub } from '@fastgpt/service/support/wallet/sub/schema';
import { ApiRequestProps } from '@fastgpt/service/type/next';
import { NextApiResponse } from 'next';

export type UpdatePlanBody = {
  id: string;
  type: `${SubTypeEnum}`;
  startTime: string;
  expiredTime: string;
  price: number;
  totalPoints?: number;
  surplusPoints?: number;
  extraDatasetSize?: number;
  level?: number;
};

async function handler(req: ApiRequestProps<UpdatePlanBody>, res: NextApiResponse<any>) {
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
  } = req.body;

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
    await mongoSessionRun(async (session) => {
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
        },
        {
          session
        }
      );
      await reComputeStandPlans(sub.teamId, session);
    });
  }

  return result;
}
export default NextAPI(handler);
