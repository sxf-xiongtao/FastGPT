import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@/service/response';
import { MongoUser } from '@fastgpt/support/user/schema';
import { connectToDatabase } from '@/service/mongo';
import { generateToken, setCookie } from '@/service/utils/tools';
import { PRICE_SCALE, UserAuthTypeEnum } from '@/constants/common';
import { authCode } from '../../inform/sendAuthCode';
import { authMaxUsers } from '@/service/support/user/auth';
import { createUserByUsername } from '@/service/support/user/tools';
import { createOnePromotion } from '@/service/support/user/promotion';

export default async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  try {
    const { username, code, password, inviterId } = req.body;
    await connectToDatabase();

    if (!username || !code || !password) {
      throw new Error('缺少参数');
    }

    // 验证码校验
    await authCode({
      username,
      type: UserAuthTypeEnum.register,
      code
    });

    // 重名校验
    const authRepeat = await MongoUser.findOne({
      username
    });

    if (authRepeat) {
      throw new Error('该用户已被注册');
    }

    await authMaxUsers();

    const user = await createUserByUsername({
      username,
      password,
      inviterId
    });

    const token = generateToken(user._id);
    setCookie(res, token);

    if (!username.includes('@')) {
      createOnePromotion({
        userId: inviterId,
        objUId: user._id,
        type: 'register',
        amount: 5 * PRICE_SCALE
      });
    }

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
