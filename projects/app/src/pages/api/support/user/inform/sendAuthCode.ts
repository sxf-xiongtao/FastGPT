import { MongoUserAuth } from '@/service/support/user/auth/schema';
import { customAlphabet } from 'nanoid';
import requestIp from 'request-ip';
import { UserAuthTypeEnum } from '@fastgpt/global/support/user/auth/constants';
import { authGoogleToken } from '@/service/common/system/actionAuth';
import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { CommonErrEnum } from '@fastgpt/global/common/error/code/common';
import { sendMessage } from '@/service/support/user/inform/sendMessage';
import { getMessageTemplate } from '@/service/support/user/inform/constants';
import { checkTimerLock } from '@fastgpt/service/common/system/timerLock/utils';
import { authCode } from '@/service/support/user/auth/controller';

const nanoid = customAlphabet('123456789', 6);

export type SendAuthCodeQuery = {};
export type SendAuthCodeBody = {
  username: string;
  type: `${UserAuthTypeEnum}`;
  googleToken: string;
  captcha: string;
};
export type SendAuthCodeResponse = {};

async function handler(
  req: ApiRequestProps<SendAuthCodeBody, SendAuthCodeQuery>,
  _res: ApiResponseType<any>
): Promise<SendAuthCodeResponse> {
  const { username, type, googleToken, captcha } = req.body;

  if (!username || !type) {
    return Promise.reject(CommonErrEnum.missingParams);
  }

  await authCode({
    username,
    type: UserAuthTypeEnum.captcha,
    code: captcha
  });

  // google auth
  await authGoogleToken({
    googleToken: googleToken,
    remoteip: requestIp.getClientIp(req)
  });

  const templateCode = (() => {
    switch (type) {
      case UserAuthTypeEnum.register:
        return 'REGISTER';
      case UserAuthTypeEnum.findPassword:
        return 'RESET_PASSWORD';
      case UserAuthTypeEnum.bindNotification:
        return 'BIND_NOTIFICATION';
      default:
        return undefined;
    }
  })();

  if (!templateCode) {
    return Promise.reject('Wrong type of verify code');
  }

  // Check send auth lock
  const { lockMinutes } = getMessageTemplate(templateCode);
  const timerId = `auth--${username}--${type}`;
  if (
    !(await checkTimerLock({
      timerId,
      lockMinuted: lockMinutes
    }))
  ) {
    return Promise.reject('请勿频繁获取验证码');
  }

  // 创建 auth 记录
  const code = nanoid();
  await MongoUserAuth.create({
    key: username,
    type,
    code
  });

  await sendMessage({
    target: username,
    templateCode,
    templateParam: {
      code
    }
  });
  return {
    message: '发送验证码成功'
  };
}

export default NextAPI(handler);
