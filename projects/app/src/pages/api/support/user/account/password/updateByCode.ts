import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { connectToDatabase } from '@/service/mongo';
import { UserAuthTypeEnum } from '@fastgpt/global/support/user/constant';
import { createJWT, setCookie } from '@fastgpt/service/support/permission/controller';
import { authCode } from '../../inform/sendAuthCode';
import { getUserDetail } from '@/service/support/user/controller';

export default async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  try {
    const { username, code, password, tmbId } = req.body;

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

    const user = await MongoUser.findOne({ username });

    if (!user) {
      throw new Error('更新用户信息失败');
    }
    const userInfo = await getUserDetail(tmbId, user._id);

    const token = createJWT(userInfo);
    setCookie(res, token);

    jsonRes(res, {
      data: {
        user: userInfo,
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
