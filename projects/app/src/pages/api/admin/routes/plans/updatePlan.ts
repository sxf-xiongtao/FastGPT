import { reComputeStandPlans } from '@/service/support/wallet/sub/controller';
import { NextAPI } from '@/service/middleware/entry';

import { adminCert } from '@/service/support/permission/adminCert';
import { PRICE_SCALE } from '@fastgpt/global/support/wallet/constants';
import { SubTypeEnum } from '@fastgpt/global/support/wallet/sub/constants';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import { MongoTeamSub } from '@fastgpt/service/support/wallet/sub/schema';
import { ApiRequestProps } from '@fastgpt/service/type/next';
import { NextApiResponse } from 'next';
import { addAuditLog } from '@fastgpt/service/support/user/audit/util';
import { AdminAuditEventEnum } from '@fastgpt/global/support/user/audit/constants';
import { getUserDetail } from '@fastgpt/service/support/user/controller';

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

  maxTeamMember?: number;
  maxApp?: number;
  maxDataset?: number;
};

async function handler(req: ApiRequestProps<UpdatePlanBody>, res: NextApiResponse<any>) {
  const authResult = await adminCert({ req, authToken: true });

  const {
    id,
    type,
    startTime,
    expiredTime,
    price,
    totalPoints,
    surplusPoints,
    extraDatasetSize,
    level,
    maxTeamMember,
    maxApp,
    maxDataset
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
          surplusPoints,

          maxTeamMember: maxTeamMember || null,
          maxApp: maxApp || null,
          maxDataset: maxDataset || null
        },
        {
          session
        }
      );
      await reComputeStandPlans(sub.teamId, session);
    });
  }

  const userDetail = await getUserDetail({
    tmbId: authResult.tmbId,
    userId: authResult.userId
  });

  (async () => {
    addAuditLog({
      tmbId: authResult.tmbId,
      teamId: userDetail.team.teamId,
      event: AdminAuditEventEnum.ADMIN_UPDATE_PLAN,
      params: {
        teamId: sub.teamId
      }
    });
  })();

  return result;
}
export default NextAPI(handler);
