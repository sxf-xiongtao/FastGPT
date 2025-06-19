import { reComputeStandPlans } from '@/service/support/wallet/sub/controller';
import { NextAPI } from '@/service/middleware/entry';

import { adminCert } from '@/service/support/permission/adminCert';
import { PRICE_SCALE } from '@fastgpt/global/support/wallet/constants';
import { StandardSubLevelEnum, SubTypeEnum } from '@fastgpt/global/support/wallet/sub/constants';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import { jsonRes } from '@fastgpt/service/common/response';
import { MongoTeam } from '@fastgpt/service/support/user/team/teamSchema';
import { MongoTeamSub } from '@fastgpt/service/support/wallet/sub/schema';
import { ApiRequestProps } from '@fastgpt/service/type/next';
import { NextApiRequest, NextApiResponse } from 'next';
import { addAuditLog } from '@fastgpt/service/support/user/audit/util';
import { AdminAuditEventEnum } from '@fastgpt/global/support/user/audit/constants';
import { getUserDetail } from '@fastgpt/service/support/user/controller';

export type AddTeamPlanBody = {
  teamId: string; // 团队id
  type: SubTypeEnum; // 套餐类型
  startTime: string; // 开始时间
  expiredTime: string; // 结束时间
  price: number; // 价格
  level: StandardSubLevelEnum; // 套餐等级
  extraDatasetSize: number; // 额外知识库容量
  totalPoints: number; // 总积分
  surplusPoints: number; // 剩余积分
};

async function handler(req: ApiRequestProps<AddTeamPlanBody>, res: NextApiResponse) {
  const authResult = await adminCert({ req, authToken: true });

  const {
    teamId,
    type,
    level,
    startTime,
    expiredTime,
    price,
    extraDatasetSize,
    totalPoints,
    surplusPoints
  } = req.body;

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
  } else if (type === SubTypeEnum.standard) {
    // 1. 查找是否有相同类型的订阅，有的话，直接更新过期时间和增加积分；没有的话，创建新的订阅
    const teamSub = await MongoTeamSub.findOne({
      teamId,
      type: SubTypeEnum.standard,
      currentSubLevel: level
    });

    if (teamSub) {
      return Promise.reject('已存在相同类型的订阅');
    }

    await mongoSessionRun(async (session) => {
      result = await MongoTeamSub.create(
        [
          {
            teamId,
            type,
            startTime,
            expiredTime,
            price: price * PRICE_SCALE,
            currentSubLevel: level,
            totalPoints,
            surplusPoints
          }
        ],
        {
          session,
          ordered: true
        }
      );
      await reComputeStandPlans(teamId, session);
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
      event: AdminAuditEventEnum.ADMIN_ADD_PLAN,
      params: {
        teamId: teamId
      }
    });
  })();

  jsonRes(res, {
    data: {
      result
    }
  });
}

export default NextAPI(handler);
