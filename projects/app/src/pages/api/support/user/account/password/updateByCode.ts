import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { connectToDatabase } from '@/service/mongo';
import { UserAuthTypeEnum } from '@/constants/common';
import { createJWT, setCookie } from '@fastgpt/service/support/permission/controller';
import { authCode } from '../../inform/sendAuthCode';

export default async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  try {
    const { username, code, password } = req.body;

    await connectToDatabase();

    if (!username || !code || !password) {
      throw new Error('缺少参数');
    }

    // 验证码校验
    await authCode({
      username,
      code,
      type: UserAuthTypeEnum.findPassword
    });

    // 更新对应的记录
    await MongoUser.updateOne(
      {
        username
      },
      {
        password
      }
    );

    // 根据 username 获取用户信息
    const user = await MongoUser.findOne({
      username
    });

    if (!user) {
      throw new Error('获取用户信息异常');
    }

    const token = createJWT(user._id);
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
