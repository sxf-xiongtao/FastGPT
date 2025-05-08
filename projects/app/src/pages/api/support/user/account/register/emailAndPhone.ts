import type { NextApiResponse } from 'next';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { createJWT, setCookie } from '@fastgpt/service/support/permission/controller';
import { UserAuthTypeEnum } from '@fastgpt/global/support/user/auth/constants';
import { PRICE_SCALE } from '@fastgpt/global/support/wallet/constants';
import { authCode } from '@fastgpt/service/support/user/auth/controller';
import { authMaxUsers } from '@/service/support/user/auth';
import { createUserByUsername } from '@/service/support/user/controller';
import { createOnePromotion } from '@/service/support/activity/promotion/controller';
import { Types } from '@fastgpt/service/common/mongo';
import { trackBaiduConversion } from '@/service/common/tracking/baidu';
import { ApiRequestProps } from '@fastgpt/service/type/next';
import { AccountRegisterBody } from '@fastgpt/global/support/user/login/api';
import { NextAPI } from '@/service/middleware/entry';
import { UserErrEnum } from '@fastgpt/global/common/error/code/user';
import type { LoginSuccessResponse } from '../password/updateByCode';
import { CommonErrEnum } from '@fastgpt/global/common/error/code/common';

async function handler(
  req: ApiRequestProps<AccountRegisterBody>,
  res: NextApiResponse<any>
): Promise<LoginSuccessResponse> {
  const { username, code, password, inviterId, bd_vid, fastgpt_sem, sourceDomain } = req.body;

  if (!username || !code || !password) {
    return Promise.reject(CommonErrEnum.invalidParams);
  }

  // 验证码校验
  await authCode({
    key: username,
    type: UserAuthTypeEnum.register,
    code
  });

  // 重名校验
  const authRepeat = await MongoUser.findOne({
    username
  });

  if (authRepeat) {
    return Promise.reject(UserErrEnum.userExist);
  }

  // 商业版用户数量相知
  await authMaxUsers();

  const user = await createUserByUsername({
    username,
    password,
    notificationAccount: username,
    phonePrefix: 86, // 目前只支持国内的
    inviterId,
    fastgpt_sem,
    sourceDomain,
    passwordUpdateTime: new Date()
  });

  const token = createJWT(user);
  setCookie(res, token);

  if (!username.includes('@') && inviterId && Types.ObjectId.isValid(inviterId)) {
    createOnePromotion({
      userId: inviterId,
      objUId: user._id,
      type: 'register',
      amount: 5 * PRICE_SCALE
    });
  }

  // 百度转化
  bd_vid && trackBaiduConversion(bd_vid);

  return {
    user,
    token
  };
}

export default NextAPI(handler);
