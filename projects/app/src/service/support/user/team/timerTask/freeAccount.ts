import { MongoTeamSub } from '@fastgpt/service/support/wallet/sub/schema';
import { StandardSubLevelEnum, SubTypeEnum } from '@fastgpt/global/support/wallet/sub/constants';
import { TeamSubSchema } from '@fastgpt/global/support/wallet/sub/type';
import { addDays, differenceInDays } from 'date-fns';
import { systemUseTeamPlanning } from '@/service/support/wallet/sub/utils';
import { readFromSecondary } from '@fastgpt/service/common/mongo/utils';
import { addLog } from '@fastgpt/service/common/system/log';
import { sendInform2OneUser } from '../../inform/controller';
import { MongoTeam } from '@fastgpt/service/support/user/team/teamSchema';

/* 
  清除不活跃用户的知识库
  1. free 计划
  2. 没有额外资源包
  3. 30天没有usage记录的
*/
let deleteUser = 0;
export const checkFreeAccount = async (expiredDay: number = 30, oldDateInform?: number) => {
  // 检查是否开启了订阅模式
  if (!systemUseTeamPlanning() || process.env.CLEAR_FREE_ACCOUNT !== 'true') {
    return;
  }

  const clearDay = addDays(new Date(), -expiredDay);

  const freePlans = await MongoTeamSub.find(
    {
      type: SubTypeEnum.standard,
      /*  当前时间 8 月 7 日，过期时间 30 天，举例： 
          清理时间为：7 月 7 日，则获取 7 月 17 日前，7 月 2 日后的数据
          如果过期时间在 7 月 7 日之前，说明超过 1 个月没有登录过了（登录会重置套餐）
      */
      expiredTime: { $lte: addDays(clearDay, 10), $gte: addDays(clearDay, -5) },
      currentSubLevel: StandardSubLevelEnum.free
    },
    'teamId expiredTime',
    { ...readFromSecondary }
  ).lean();
  console.log('Check free plan amount', freePlans.length);

  for await (const plan of freePlans) {
    await checkUsageTime(plan, clearDay, oldDateInform);
  }
};

const checkUsageTime = async (plan: TeamSubSchema, clearDay: Date, oldDateInform?: number) => {
  const teamId = plan.teamId;
  const expiredTime = plan.expiredTime;

  try {
    // 如果团队还有其他订阅内容，也不删除
    const extraPlan = await MongoTeamSub.findOne(
      {
        teamId: teamId,
        type: { $ne: SubTypeEnum.standard }
      },
      '_id',
      {
        ...readFromSecondary
      }
    ).lean();

    if (extraPlan) return;

    // 距离 expiredDay 还有 7 3 1 天 发送消息
    const diffDay = differenceInDays(expiredTime, clearDay) + 1;
    const NOTIFY_DAYS = new Set([7, 3, 1]);
    if (NOTIFY_DAYS.has(diffDay)) {
      return notifyOneFreeClean(teamId, diffDay);
    } else if (diffDay < 0) {
      return clearFreeAccount(teamId);
    }
  } catch (error) {
    addLog.error('Check free plan error', error);
  }
};

const clearFreeAccount = async (teamId: string) => {
  try {
    // get all dataset
    // const datasets = await MongoDataset.find({ teamId }, '_id teamId').lean();
    // await mongoSessionRun(async (session) => {
    //   // delete dataset data
    //   await delDatasetRelevantData({ datasets, session });
    //   await MongoDataset.deleteMany(
    //     {
    //       teamId
    //     },
    //     { session }
    //   );
    // });
    console.log('清除不活跃用户知识库', ++deleteUser, teamId);
  } catch (error) {
    addLog.error(`清除不活跃用户知识库异常: ${teamId}`, error);
  }
};

const notifyOneFreeClean = async (teamId: string, day: number) => {
  const team = await MongoTeam.findById(teamId).lean();
  if (!team) {
    addLog.error('Can not find team', teamId);
    return false;
  }

  return sendInform2OneUser({
    teamId,
    userId: team.ownerId,
    templateCode: 'FREE_CLEAN',
    templateParam: { day },
    level: 'emergency'
  });
};
