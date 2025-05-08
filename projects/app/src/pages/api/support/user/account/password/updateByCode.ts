import type { NextApiResponse } from 'next';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { UserAuthTypeEnum } from '@fastgpt/global/support/user/auth/constants';
import { createJWT, setCookie } from '@fastgpt/service/support/permission/controller';
import { authCode } from '@fastgpt/service/support/user/auth/controller';
import { getUserDetail } from '@fastgpt/service/support/user/controller';
import { UserErrEnum } from '@fastgpt/global/common/error/code/user';
import { NextAPI } from '@/service/middleware/entry';
import { CommonErrEnum } from '@fastgpt/global/common/error/code/common';
import { UserType } from '@fastgpt/global/support/user/type';
import { ApiRequestProps } from '@fastgpt/service/type/next';

export type UpdatePswByCodeBody = {
  username: string;
  code: string;
  password: string;
  tmbId: string;
};
export type LoginSuccessResponse = {
  user: UserType;
  token: string;
};

async function handler(
  req: ApiRequestProps<UpdatePswByCodeBody>,
  res: NextApiResponse<any>
): Promise<LoginSuccessResponse> {
  const { username, code, password, tmbId } = req.body;

  if (!username || !code || !password) {
    return Promise.reject(CommonErrEnum.invalidParams);
  }

  // 验证码校验
  await authCode({
    key: username,
    code,
    type: UserAuthTypeEnum.findPassword
  });

  // 更新对应的记录
  await MongoUser.updateOne(
    {
      username
    },
    {
      password,
      passwordUpdateTime: new Date()
    }
  );

  const user = await MongoUser.findOne({ username });

  if (!user) {
    return Promise.reject(UserErrEnum.notUser);
  }
  const userInfo = await getUserDetail({ tmbId, userId: user._id });

  const token = createJWT(userInfo);
  setCookie(res, token);

  return {
    user: userInfo,
    token
  };
}

export default NextAPI(handler);
