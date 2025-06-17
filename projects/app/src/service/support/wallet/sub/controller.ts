import {
  StandardSubLevelEnum,
  SubModeEnum,
  SubTypeEnum
} from '@fastgpt/global/support/wallet/sub/constants';
import { ClientSession } from '@fastgpt/service/common/mongo';
import { MongoTeamSub } from '@fastgpt/service/support/wallet/sub/schema';
import { sortStandPlans, clearTeamPointsCache } from '@fastgpt/service/support/wallet/sub/utils';
import { addDays } from 'date-fns';

/* 
  标准套餐从新计算开始和结束时间
  最大的套餐，开始和结束时间不变。（最大的套餐，开始时间肯定早于当前时间）
  逐一从高套餐往低套餐遍历：
  i 的时长 = i 的结束时间 - i 的开始时间
  i 的开始时间 = i-1 的结束时间
  i 的结束时间 = i 新的开始时间 + i 的时长
*/
export const reComputeStandPlans = async (teamId: string, session: ClientSession) => {
  const plans = await MongoTeamSub.find({
    teamId,
    type: SubTypeEnum.standard
  }).session(session);

  sortStandPlans(plans);

  for (let i = 1; i < plans.length; i++) {
    const plan = plans[i];
    const lastPlan = plans[i - 1];
    const duration = Math.abs(plan.expiredTime.getTime() - plan.startTime.getTime());
    plan.startTime = lastPlan.expiredTime;
    plan.expiredTime = new Date(plan.startTime.getTime() + duration);
  }

  for await (const plan of plans) {
    await plan.save({ session });
  }
};

export const addStandardSub = async ({
  teamId,
  level,
  totalPoints,
  durationDay,
  subMode,
  session
}: {
  teamId: string;
  level: `${StandardSubLevelEnum}`;
  totalPoints: number;
  durationDay: number;
  subMode?: `${SubModeEnum}`;
  session: ClientSession;
}) => {
  // 1. 查找是否有相同类型的订阅，有的话，直接更新过期时间和增加积分；没有的话，创建新的订阅
  const teamSub = await MongoTeamSub.findOne({
    teamId,
    type: SubTypeEnum.standard,
    currentSubLevel: level
  }).session(session);

  // 2. 更新订阅套餐，追加/新增
  if (teamSub) {
    teamSub.totalPoints += totalPoints;
    teamSub.surplusPoints += totalPoints;
    teamSub.expiredTime = addDays(teamSub.expiredTime, durationDay);
    await teamSub.save({ session });
  } else {
    const startTime = new Date();
    const expiredTime = addDays(startTime, durationDay);
    await MongoTeamSub.create(
      [
        {
          teamId,
          type: SubTypeEnum.standard,
          startTime,
          expiredTime,
          currentMode: subMode,
          nextMode: subMode,
          currentSubLevel: level,
          nextSubLevel: level,
          totalPoints,
          surplusPoints: totalPoints
        }
      ],
      { session }
    );
  }

  // 2. 重新排序标准订阅
  await reComputeStandPlans(teamId, session);

  // 3. 清除积分缓存，确保下次获取时重新计算
  await clearTeamPointsCache(teamId);
};

export const addExtraDatasetSizeSub = async ({
  teamId,
  datasetSize,
  durationDay,
  price,
  session
}: {
  teamId: string;
  datasetSize: number;
  durationDay: number;
  price: number;
  session: ClientSession;
}) => {
  const startTime = new Date();
  const expiredTime = addDays(startTime, durationDay);
  await MongoTeamSub.create(
    [
      {
        teamId,
        type: SubTypeEnum.extraDatasetSize,
        startTime,
        expiredTime,
        price,
        currentExtraDatasetSize: datasetSize
      }
    ],
    { session }
  );
};

export const addExtraPointsSub = async ({
  teamId,
  points,
  durationDay,
  price,
  session
}: {
  teamId: string;
  points: number;
  durationDay: number;
  price: number;
  session: ClientSession;
}) => {
  const startTime = new Date();
  const expiredTime = addDays(startTime, durationDay);
  // push extra dataset size sub
  await MongoTeamSub.create(
    [
      {
        teamId,
        type: SubTypeEnum.extraPoints,
        startTime,
        expiredTime,
        price,
        totalPoints: points,
        surplusPoints: points
      }
    ],
    { session }
  );

  // 清除积分缓存，确保下次获取时重新计算
  await clearTeamPointsCache(teamId);
};
