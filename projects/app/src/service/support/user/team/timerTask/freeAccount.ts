import { MongoTeamSub } from '@fastgpt/service/support/wallet/sub/schema';
import { StandardSubLevelEnum, SubTypeEnum } from '@fastgpt/global/support/wallet/sub/constants';
import { TeamSubSchema } from '@fastgpt/global/support/wallet/sub/type';
import { MongoUsage } from '@fastgpt/service/support/wallet/usage/schema';
import { addDays, differenceInDays } from 'date-fns';
import { MongoDataset } from '@fastgpt/service/core/dataset/schema';
import { systemUseTeamPlanning } from '@/service/support/wallet/sub/utils';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import { delDatasetRelevantData } from '@fastgpt/service/core/dataset/controller';
import { readFromSecondary } from '@fastgpt/service/common/mongo/utils';
import { addLog } from '@fastgpt/service/common/system/log';
import { formatTime2YMD } from '@fastgpt/global/common/string/time';
import { sendInform2OneUser } from '../../inform/controller';

/* 
  清除不活跃用户的知识库
  1. free 计划
  2. 没有额外资源包
  3. 30天没有usage记录的
*/
let deleteUser = 0;
export const checkFreeAccount = async (expiredDay: number = 30) => {
  // 检查是否开启了订阅模式
  if (!systemUseTeamPlanning()) {
    return;
  }

  const freePlans = await MongoTeamSub.find(
    {
      type: SubTypeEnum.standard,
      expiredTime: { $exists: true },
      currentSubLevel: StandardSubLevelEnum.free
    },
    'teamId',
    { ...readFromSecondary }
  ).lean();
  console.log('total free plan', freePlans.length);

  for await (const plan of freePlans) {
    await checkUsageTime(plan.teamId, expiredDay);
  }
};

const checkUsageTime = async (teamId: string, expiredDay: number) => {
  try {
    // 还有订阅内容，忽略
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

    // 获取最新的一条使用记录
    const lastUsage = await MongoUsage.findOne(
      {
        teamId
      },
      '_id time',
      {
        ...readFromSecondary
      }
    )
      .sort({
        _id: -1
      })
      .lean();

    if (!lastUsage) {
      console.log('Not usage team', teamId);
      notifyOneFreeClean(teamId, 7);
      return clearFreeAccount(teamId);
    }

    // 距离 expiredDay 还有 7 3 天，1 天 发送消息
    const lastUsageTime = new Date(lastUsage.time);
    const expiredTime = addDays(new Date(), -expiredDay);
    const diffDay = differenceInDays(lastUsageTime, expiredTime);

    if (diffDay === 7) {
      notifyOneFreeClean(teamId, 7);
    } else if (diffDay === 3) {
      notifyOneFreeClean(teamId, 3);
    } else if (diffDay === 1) {
      notifyOneFreeClean(teamId, 1);
    }

    // 已经过期的
    if (diffDay < 0) {
      return clearFreeAccount(teamId);
    }
  } catch (error) {
    addLog.error('Check free plan error', error);
  }
};

const clearFreeAccount = async (teamId: string) => {
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
};

const notifyOneFreeClean = (teamId: string, day: number) => {
  sendInform2OneUser({
    teamId,
    templateCode: 'FREE_CLEAN',
    templateParam: {
      day
    },
    level: 'emergency'
  });
};
