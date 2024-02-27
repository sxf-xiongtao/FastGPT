import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { MongoTeamSub } from '@fastgpt/service/support/wallet/sub/schema';
import {
  StandardSubLevelEnum,
  SubModeEnum,
  SubTypeEnum
} from '@fastgpt/global/support/wallet/sub/constants';
import { MongoTeam } from '@fastgpt/service/support/user/team/teamSchema';
import { getStandardPlan, initTeamSubPlan2Free } from '@/service/support/wallet/sub/utils';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import { PRICE_SCALE } from '@fastgpt/global/support/wallet/constants';
import { addMonths } from 'date-fns';
import { createStandardSubBill } from '@/service/support/wallet/sub/bill';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { TeamMemberRoleEnum } from '@fastgpt/global/support/user/team/constant';
import { TeamSubSchema } from '@fastgpt/global/support/wallet/sub/type';

/* 
  更新过期的标准订阅
*/
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await authCert({ req, authRoot: true });
    await connectToDatabase();

    // 1. 找出所有过期的
    const plans = await MongoTeamSub.find({
      type: SubTypeEnum.standard,
      expiredTime: { $lte: new Date() }
    });

    console.log('total expired plan', plans.length);

    for await (const plan of plans) {
      await updatePlan(plan);
    }

    jsonRes(res, {
      data: plans.length,
      message: 'success'
    });
  } catch (error) {
    console.log(error);
    jsonRes(res, {
      code: 500,
      error
    });
  }
}

const updatePlan = async (plan: TeamSubSchema) => {
  try {
    // 计算出下一个周期的相关订阅参数
    const [team, owner] = await Promise.all([
      MongoTeam.findById(plan.teamId),
      MongoTeamMember.findOne({ teamId: plan.teamId, role: TeamMemberRoleEnum.owner })
    ]);
    if (!team || !owner) return;

    const newPlanContent = getStandardPlan(plan.nextSubLevel);
    if (!newPlanContent) return;

    const monthMap =
      plan.nextMode === SubModeEnum.month || plan.nextSubLevel === StandardSubLevelEnum.free
        ? {
            num: 1,
            priceNum: 1
          }
        : { num: 12, priceNum: 10 };

    const newTotalPoints = newPlanContent.totalPoints * monthMap.num;
    const newPlanPointUnitPrice = newPlanContent.pointPrice * PRICE_SCALE;
    const newPlanPointPrice = newPlanPointUnitPrice * monthMap.priceNum;

    const newPlanUnitPrice = newPlanContent.price * PRICE_SCALE;
    const newPlanPrice = newPlanUnitPrice * monthMap.priceNum;

    const balanceEnough = team.balance >= newPlanPrice;

    // 余额不足，改成免费版
    if (!balanceEnough) {
      await initTeamSubPlan2Free({ teamId: team._id });
      return;
    }

    // 余额充足，更新订阅内容
    await mongoSessionRun(async (session) => {
      // 更新订阅内容
      await MongoTeamSub.findOneAndUpdate(
        {
          teamId: team._id,
          type: SubTypeEnum.standard
        },
        {
          currentMode: plan.nextMode,
          price: newPlanPrice,
          pointPrice: newPlanPointPrice,
          currentSubLevel: plan.nextSubLevel,
          startTime: new Date(),
          expiredTime: addMonths(new Date(), monthMap.num),
          totalPoints: newTotalPoints,
          surplusPoints: newTotalPoints
        },
        { session }
      );

      // 检查是否需要创建余额
      await createStandardSubBill({
        teamId: team._id,
        tmbId: owner._id,
        payPrice: newPlanPrice,
        level: plan.nextSubLevel,
        mode: plan.nextMode,
        session
      });
    });

    console.log('update team plan', {
      currentMode: plan.nextMode,
      price: newPlanPrice,
      pointPrice: newPlanPointPrice,
      currentSubLevel: plan.nextSubLevel,
      startTime: new Date(),
      expiredTime: addMonths(new Date(), monthMap.num),
      totalPoints: newTotalPoints,
      surplusPoints: newTotalPoints
    });
  } catch (error) {
    console.log('更新团队订阅失败', error);
  }
};
