import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { addLog } from '@fastgpt/service/common/system/log';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { MongoTeam } from '@fastgpt/service/support/user/team/teamSchema';
import { createTeam } from '@/service/support/user/team/controller';
import { addHours } from 'date-fns';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';

/* 
  创建用户流程：
  1. 创用户
  2. 创 team
  3. 创 teamMember

  两种可能的异常：
  1. 有 user，但是没有 team (创建user成功，team 失败): 
  2. 有 user, team 但是没有 teamMember (创建user成功，team成功，teamMember失败)

  找后，都给它创建一个默认的团队和团队成员。
*/

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { startHour = 72, endHour = 24 } = req.body as { startHour?: number; endHour?: number };
    await authCert({ req, authRoot: true });
    await connectToDatabase();

    // start: now - maxDay, end: now - 3 day
    const start = addHours(new Date(), -startHour);
    const end = addHours(new Date(), -endHour);

    const invalidUserIds = await checkInvalidUser(start, end);

    jsonRes(res, {
      data: {
        invalidUserIds
      },
      message: 'success'
    });
  } catch (error) {
    addLog.error(`check Invalid user error`, error);

    jsonRes(res, {
      code: 500,
      error
    });
  }
}

export async function checkInvalidUser(start: Date, end: Date) {
  const where = {
    createTime: { $gte: start, $lte: end }
  };

  // 1. get all users _id
  const users = await MongoUser.find(where, '_id avatar');
  console.log('total users', users.length);

  let invalidUserIds: string[] = [];
  let finish = 0;

  for await (const user of users) {
    try {
      const { _id } = user;
      // 找 Team 里是否有对应的 owner
      const [teamCount, tmbCount] = await Promise.all([
        MongoTeam.countDocuments({ ownerId: _id }),
        MongoTeamMember.countDocuments({ userId: _id })
      ]);

      // 其中一个为空，说明tmb都没有创建出来。
      if (teamCount === 0 || tmbCount === 0) {
        addLog.warn('无效用户, 正在为他创建团队:', { userId: _id });
        invalidUserIds.push(_id);

        // 给他创建团队
        await mongoSessionRun(async (session) =>
          createTeam({
            ownerId: _id,
            name: 'My Team',
            avatar: user.avatar,
            defaultTeam: true,
            session
          })
        );
      }
    } catch (error) {}
    console.log('check user', ++finish);
  }

  return invalidUserIds;
}
