import { syncUserAndOrg } from '@/service/support/user/sync';
import { createStandardSubBill } from '@/service/support/wallet/sub/bill';
import { TeamMemberRoleEnum } from '@fastgpt/global/support/user/team/constant';
import { PRICE_SCALE } from '@fastgpt/global/support/wallet/constants';
import {
  StandardSubLevelEnum,
  SubModeEnum,
  SubTypeEnum
} from '@fastgpt/global/support/wallet/sub/constants';
import type { TeamSubSchema } from '@fastgpt/global/support/wallet/sub/type';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import { addLog } from '@fastgpt/service/common/system/log';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { MongoTeam } from '@fastgpt/service/support/user/team/teamSchema';
import { MongoTeamSub } from '@fastgpt/service/support/wallet/sub/schema';
import { getStandardPlanConfig, initTeamFreePlan } from '@fastgpt/service/support/wallet/sub/utils';
import { addMonths } from 'date-fns';

/*
  1. Extra dataset
  2. Not free standard plans
*/
export const clearExpiredSubPlan = async () => {
  const extraPlans = await MongoTeamSub.deleteMany({
    type: [SubTypeEnum.extraDatasetSize, SubTypeEnum.extraPoints],
    expiredTime: { $lte: new Date() }
  });

  addLog.info(`删除过期的额外套餐: ${extraPlans.deletedCount}`);

  const standardPlans = await MongoTeamSub.deleteMany({
    type: SubTypeEnum.standard,
    expiredTime: { $lte: new Date() },
    currentSubLevel: [
      StandardSubLevelEnum.experience,
      StandardSubLevelEnum.team,
      StandardSubLevelEnum.enterprise,
      StandardSubLevelEnum.custom
    ]
  });

  addLog.info(`删除过期的订阅套餐: ${standardPlans.deletedCount}`);
};

/*
  TODO: 未来改成续费国外订阅模式，目前下面的代码不再使用
*/
export const updateStandardPlan = async () => {
  const updatePlan = async (plan: TeamSubSchema) => {
    try {
      // 计算出下一个周期的相关订阅参数
      const [team, owner] = await Promise.all([
        MongoTeam.findById(plan.teamId),
        MongoTeamMember.findOne({ teamId: plan.teamId, role: TeamMemberRoleEnum.owner })
      ]);
      if (!team || !owner) return;

      const newPlanContent = getStandardPlanConfig(plan.nextSubLevel);
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
        await initTeamFreePlan({ teamId: team._id });
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

        await createStandardSubBill({
          teamId: team._id,
          tmbId: owner._id,
          payPrice: newPlanPrice,
          level: plan.nextSubLevel,
          mode: plan.nextMode,
          session
        });
      });

      addLog.info('Update team plan', {
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

  // 1. 找出所有非免费的过期计划
  const plans = await MongoTeamSub.find({
    type: SubTypeEnum.standard,
    currentSubLevel: { $ne: StandardSubLevelEnum.free },
    expiredTime: { $lte: new Date() }
  });

  for await (const plan of plans) {
    await updatePlan(plan);
  }

  addLog.info(`更新标准套餐完成`);
};

export const syncMemberAndOrg = async () => {
  if (global.systemConfig.teamMode === 'sync') {
    addLog.info('开始同步成员和组织');
    await syncUserAndOrg();
    addLog.info('同步成员和组织完成');
  }
};
