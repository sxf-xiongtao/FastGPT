/* 
    Gets the amount to be paid to modify the subscription
*/
import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import {
  StandardSubPlanParams,
  StandardSubPlanUpdateResponse
} from '@fastgpt/global/support/wallet/sub/api';
import { MongoTeamSub } from '@fastgpt/service/support/wallet/sub/schema';
import { calculateDaysBetweenDates } from '@fastgpt/global/common/math/date';
import {
  POINTS_SCALE,
  StandardSubLevelEnum,
  SubModeEnum,
  SubTypeEnum,
  standardSubLevelMap,
  subModeMap
} from '@fastgpt/global/support/wallet/sub/constants';
import { PRICE_SCALE } from '@fastgpt/global/support/wallet/bill/constants';
import { authUserNotVisitor } from '@fastgpt/service/support/permission/auth/user';
import { TeamItemType } from '@fastgpt/global/support/user/team/type';
import { addDays, addMonths } from 'date-fns';
import { checkStandardPlanLarge, getStandardPlan } from '@/service/support/wallet/sub/utils';

/* Update dataset size sub. */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // size: N 1000 group
  const { level, mode } = req.body as StandardSubPlanParams;

  try {
    await connectToDatabase();
    const { team } = await authUserNotVisitor({ req, authToken: true });

    jsonRes(res, {
      data: await calcStandardSubUpdateData({ level, mode, team })
    });
  } catch (err) {
    console.log(err);

    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}

export const calcStandardSubUpdateData = async ({
  level,
  mode,
  team
}: StandardSubPlanParams & { team: TeamItemType }): Promise<StandardSubPlanUpdateResponse> => {
  if (!standardSubLevelMap[level] || !subModeMap[mode]) {
    return Promise.reject('Plan or mode not found.');
  }

  // find the plan
  const oldPlan = await MongoTeamSub.findOne({
    teamId: team.teamId,
    type: SubTypeEnum.standard
  });

  if (!oldPlan) return Promise.reject('Team plan error');

  if (level === StandardSubLevelEnum.free) {
    mode = SubModeEnum.month;
  }

  const oldPlanContent = getStandardPlan(oldPlan.currentSubLevel);
  const newPlanContent = getStandardPlan(level);

  if (!oldPlanContent || !newPlanContent) return Promise.reject('Plan not found.');

  /* 
    不需要支付，只需要修改下个周期的相关参数（mode，nextLevel）
    1. 同等级变更
    2. 降级
  */
  if (
    level === oldPlan.currentSubLevel ||
    !checkStandardPlanLarge(oldPlan.currentSubLevel, level)
  ) {
    return {
      balanceEnough: true,

      planPrice: oldPlan.price,
      planPointPrice: oldPlan.pointPrice,
      currentMode: oldPlan.currentMode,
      nextMode: mode,
      currentSubLevel: oldPlan.currentSubLevel,
      nextSubLevel: level,
      totalPoints: oldPlan.totalPoints,
      surplusPoints: oldPlan.surplusPoints,
      // 订阅30天
      planStartTime: oldPlan.startTime,
      planExpiredTime: oldPlan.expiredTime
    };
  }

  /* 
    需要升级套餐，可能需要支付。一定会修改level，time, totalPoints, surplusPoints
    1. 计算剩余套餐价值
    2. 需要支付的价格 = 新套餐价格 - 剩余套餐价值
    3. 需要支付的价格 > 0，需要支付
    4. 需要支付的价格 <= 0，不需要支付，多余的加入余额
  */

  // 计算旧套餐的剩余价值
  /* 
    point: AI积分
    套餐总价格 = point的总价格(单独字段配置) + 其他价格
    剩余价值 = 剩余 point 价值 + 其他剩余价值
    剩余point价值 = (剩余point / 总point) * point的总价格(oldPlanPointPrice)
    其他剩余价值 = (总价格 - point的总价格) * (剩余天数/订阅天数)
  */
  const remainPointValue = (oldPlan.surplusPoints / oldPlan.totalPoints) * oldPlan.pointPrice;
  const oldPlanSubDay = calculateDaysBetweenDates(oldPlan.startTime, oldPlan.expiredTime);
  const oldPlanRemainDay = calculateDaysBetweenDates(new Date(), oldPlan.expiredTime);
  const remainOtherValue =
    (oldPlan.price - oldPlan.pointPrice) * (oldPlanRemainDay / oldPlanSubDay);
  const remainValue =
    oldPlan.currentSubLevel === StandardSubLevelEnum.free
      ? 0
      : remainPointValue + remainOtherValue || 0;

  const newTotalPoints =
    newPlanContent.totalPoints * (mode === SubModeEnum.month ? 1 : 12) * POINTS_SCALE;
  const newPlanPointUnitPrice = newPlanContent.pointPrice * PRICE_SCALE;
  const newPlanPointPrice =
    mode === SubModeEnum.month ? newPlanPointUnitPrice : newPlanPointUnitPrice * 10;
  const newPlanUnitPrice = newPlanContent.price * PRICE_SCALE;
  const newPlanPrice = mode === SubModeEnum.month ? newPlanUnitPrice : newPlanUnitPrice * 10;

  // 可能会有负数的情况(本来年付,改成月)
  const payPrice = newPlanPrice - remainValue || 0;

  return {
    balanceEnough: team.balance >= payPrice,
    payPrice,

    planPrice: newPlanPrice,
    planPointPrice: newPlanPointPrice,
    currentMode: mode,
    nextMode: mode,
    currentSubLevel: level,
    nextSubLevel: level,
    totalPoints: newTotalPoints,
    surplusPoints: newTotalPoints,

    planStartTime: new Date(),
    planExpiredTime: addMonths(new Date(), mode === SubModeEnum.month ? 1 : 12)
  };
};
