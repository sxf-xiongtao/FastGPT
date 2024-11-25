import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { NextAPI } from '@/service/middleware/entry';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { readFromSecondary } from '@fastgpt/service/common/mongo/utils';
import { MongoTeam } from '@fastgpt/service/support/user/team/teamSchema';
import { addLog } from '@fastgpt/service/common/system/log';
import { MongoBill } from '@/service/support/wallet/bill/schema';
import { BillStatusEnum } from '@fastgpt/global/support/wallet/bill/constants';
import { MongoTeamSub } from '@fastgpt/service/support/wallet/sub/schema';
import { StandardSubLevelEnum, SubTypeEnum } from '@fastgpt/global/support/wallet/sub/constants';
import { initTeamFreePlan } from '@fastgpt/service/support/wallet/sub/utils';
import { delay } from '@fastgpt/global/common/system/utils';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import { reComputeStandPlans } from '../../support/wallet/bill/checkPayResult';
import { addDays } from 'date-fns';

/* 
    初始化开票状态
    status === success
    1. payway 不是微信的，都设置成 true（包括不存在的）

    2. 遍历一遍用户，没有免费版套餐的，都加上免费版
*/
let index = 0;
async function handler(req: NextApiRequest, res: NextApiResponse) {
  await authCert({ req, authRoot: true });

  // 删除 5 天前的免费版
  const result = await MongoTeamSub.deleteMany({
    type: SubTypeEnum.standard,
    currentSubLevel: StandardSubLevelEnum.free,
    expiredTime: { $lt: addDays(new Date(), -5) }
  });

  const teams = await MongoTeam.find({}, '_id');

  console.log('Total users', teams.length);
  let index = 0;
  for await (const team of teams) {
    await initFreePlans(team._id);
    console.log(++index);
  }

  jsonRes(res, {
    message: 'success',
    data: result.deletedCount
  });
}

export default NextAPI(handler);

/* 
  没有 free plan 的用户，加上 free plan
*/
async function initFreePlans(teamId: string) {
  try {
    const teamSub = await MongoTeamSub.findOne({
      teamId,
      type: SubTypeEnum.standard,
      currentSubLevel: StandardSubLevelEnum.free
    });
    if (teamSub) return;

    console.log('创建free plan', teamId);
    await mongoSessionRun(async (session) => {
      await initTeamFreePlan({ teamId: teamId, session });
      await reComputeStandPlans(teamId, session);
    });
  } catch (error) {
    console.log(error);
    await delay(500);
    return initFreePlans(teamId);
  }
}
