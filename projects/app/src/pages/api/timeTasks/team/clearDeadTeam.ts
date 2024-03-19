import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { MongoTeamSub } from '@fastgpt/service/support/wallet/sub/schema';
import { StandardSubLevelEnum, SubTypeEnum } from '@fastgpt/global/support/wallet/sub/constants';
import { TeamSubSchema } from '@fastgpt/global/support/wallet/sub/type';
import { MongoUsage } from '@fastgpt/service/support/wallet/usage/schema';
import { addDays } from 'date-fns';
import { MongoDataset } from '@fastgpt/service/core/dataset/schema';
import { systemUseTeamPlanning } from '@/service/support/wallet/sub/utils';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import { delDatasetRelevantData } from '@fastgpt/service/core/dataset/controller';

/* 
    清除不活跃用户的知识库
    1. free 计划
    2. 没有额外资源包
    3. 15天没有usage记录的
*/
let deleteUser = 0;
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await authCert({ req, authRoot: true });
    await connectToDatabase();
    const { expiredDay = 15 } = req.body as { expiredDay: number };

    // 检查是否开启了订阅模式
    if (!systemUseTeamPlanning()) {
      return jsonRes(res);
    }

    const plans = await MongoTeamSub.find(
      {
        type: SubTypeEnum.standard,
        currentSubLevel: StandardSubLevelEnum.free,
        nextSubLevel: StandardSubLevelEnum.free
      },
      'teamId'
    );

    console.log('total free plan', plans.length);
    deleteUser = 0;

    for await (const plan of plans) {
      await checkDeadTeam(plan, expiredDay);
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

const checkDeadTeam = async (plan: TeamSubSchema, expiredDay: number) => {
  try {
    /* 没有使用记录 & 没有其他订阅内容 */
    const [activeUsage, extraPlan] = await Promise.all([
      MongoUsage.findOne(
        {
          teamId: plan.teamId,
          time: { $gte: addDays(new Date(), -expiredDay) }
        },
        '_id'
      ),
      MongoTeamSub.findOne({
        teamId: plan.teamId,
        type: { $ne: SubTypeEnum.standard }
      })
    ]);

    if (!activeUsage && !extraPlan) {
      // get all dataset
      const datasets = await MongoDataset.find({ teamId: plan.teamId }, '_id teamId').lean();
      await mongoSessionRun(async (session) => {
        // delete dataset data
        await delDatasetRelevantData({ datasets, session });
        await MongoDataset.deleteMany(
          {
            teamId: plan.teamId
          },
          { session }
        );
      });
      console.log('清除不活跃用户知识库', ++deleteUser, plan.teamId);
    }
  } catch (error) {}
};
