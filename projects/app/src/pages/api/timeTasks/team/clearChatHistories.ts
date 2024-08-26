import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { MongoTeamSub } from '@fastgpt/service/support/wallet/sub/schema';
import { SubTypeEnum } from '@fastgpt/global/support/wallet/sub/constants';
import { TeamSubSchema } from '@fastgpt/global/support/wallet/sub/type';
import { addDays } from 'date-fns';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import {
  getLargeStandardSubLevel,
  systemUseTeamPlanning
} from '@/service/support/wallet/sub/utils';
import { MongoChatItem } from '@fastgpt/service/core/chat/chatItemSchema';
import { MongoChat } from '@fastgpt/service/core/chat/chatSchema';
import { getStandardPlanConfig } from '@fastgpt/service/support/wallet/sub/utils';

/* 
    清除用户过期的聊天记录
*/
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await authCert({ req, authRoot: true });
    await connectToDatabase();

    // 检查是否开启了订阅模式
    if (!systemUseTeamPlanning()) {
      return jsonRes(res);
    }

    const plans = await MongoTeamSub.find(
      {
        type: SubTypeEnum.standard
      },
      'teamId currentSubLevel nextSubLevel'
    );

    console.log('total plans', plans.length);

    for await (const plan of plans) {
      await clearHistories(plan);
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

const clearHistories = async (plan: TeamSubSchema) => {
  try {
    // 获取较高级的一个level
    const level = getLargeStandardSubLevel([plan.currentSubLevel, plan.nextSubLevel]);
    const levelData = getStandardPlanConfig(level);

    if (!levelData) return;

    const expiredDay = levelData.chatHistoryStoreDuration;

    const expiredTime = addDays(new Date(), -expiredDay);
    const teamId = plan.teamId;

    await mongoSessionRun(async (session) => {
      const res1 = await MongoChat.deleteMany(
        {
          teamId,
          updateTime: { $lte: expiredTime }
        },
        { session }
      );
      const res2 = await MongoChatItem.deleteMany(
        {
          teamId,
          time: { $lte: expiredTime }
        },
        {
          session
        }
      );
      // console.log(res1, res2);
    });
  } catch (error) {}
};
