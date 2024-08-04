import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { NextAPI } from '@/service/middleware/entry';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { readFromSecondary } from '@fastgpt/service/common/mongo/utils';
import { MongoTeam } from '@fastgpt/service/support/user/team/teamSchema';
import { addLog } from '@fastgpt/service/common/system/log';

/* 
    初始化用户的账号，找到 email 和 phone，把他们赋值给所在的 owner team
*/
let index = 0;
async function handler(req: NextApiRequest, res: NextApiResponse) {
  await authCert({ req, authRoot: true });

  const users = await MongoUser.find({}, '_id username', {
    ...readFromSecondary
  }).lean();

  addLog.info(`Total user: ${users.length}`);
  index = 0;

  for await (const user of users) {
    await updateAccount({
      userId: user._id,
      username: user.username
    });
    console.log(++index);
  }

  jsonRes(res, {
    message: 'success'
  });
}

export default NextAPI(handler);

// 非手机号或邮箱跳过
async function updateAccount({
  userId,
  username,
  retry = 3
}: {
  userId: string;
  username: string;
  retry?: number;
}) {
  const regx =
    /(^1[3456789]\d{9}$)|(^[A-Za-z0-9]+([_\.][A-Za-z0-9]+)*@([A-Za-z0-9\-]+\.)+[A-Za-z]{2,6}$)/;
  if (!regx.test(username)) return;

  try {
    await MongoTeam.updateOne(
      {
        ownerId: userId,
        notificationAccount: { $exists: false }
      },
      {
        notificationAccount: username
      }
    );
    console.log('Add notificationAccount', username);
  } catch (error) {
    if (retry > 0) {
      return updateAccount({ userId, username, retry: retry - 1 });
    }
    addLog.error(`updateAccount: ${username} ${userId}`, error);
  }
}
