import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { createJWT, setCookie } from '@fastgpt/service/support/permission/controller';

import type { PostLoginProps } from '@fastgpt/global/support/user/api.d';
import { getUserDetail } from '@fastgpt/service/support/user/controller';
import { NextAPI } from '@/service/middleware/entry';
import { useIPFrequencyLimit } from '@fastgpt/service/common/middle/reqFrequencyLimit';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { username, password } = req.body as PostLoginProps;

    if (!username || !password) {
      throw new Error('username or password is required');
    }

    if (username !== 'root') {
      throw new Error('用户不存在');
    }

    const authCert = await MongoUser.findOne({
      username
    });
    if (!authCert) {
      throw new Error('用户未注册');
    }

    const user = await MongoUser.findOne({
      username,
      password
    });

    if (!user) {
      throw new Error('密码错误');
    }

    const userDetail = await getUserDetail({
      tmbId: user?.lastLoginTmbId,
      userId: user._id
    });

    const token = createJWT(userDetail);
    setCookie(res, token);

    jsonRes(res, {
      data: {
        user,
        token
      }
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}

const lockTime = Number(process.env.PASSWORD_LOGIN_LOCK_SECONDS || 120);
export default NextAPI(
  useIPFrequencyLimit({ id: 'login-by-password', seconds: lockTime, limit: 10, force: true }),
  handler
);
