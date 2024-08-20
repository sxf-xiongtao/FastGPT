import { SSOConfig, SSOEnum } from '@/global/user/auth/constants';
import { NextAPI } from '@/service/middleware/entry';
import { usernameLogin } from '@/service/support/user/controller';
import { UserType } from '@fastgpt/global/support/user/type';
import { setCookie } from '@fastgpt/service/support/permission/controller';
import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';

export type SSOQuery = any;
export type SSOBody = {};
export type SSOResponse = {
  user: UserType;
  token: string;
};

async function handler(
  req: ApiRequestProps<SSOBody, SSOQuery>,
  res: ApiResponseType<any>
): Promise<SSOResponse> {
  const SSO = process.env.SSO as SSOEnum | undefined;
  const { username, avatarURL, email } = await (async () => {
    if (SSO) {
      return SSOConfig[SSO].handler(req);
    } else {
      return Promise.reject('No SSO config');
    }
  })();

  if (!username) {
    return Promise.reject('No user');
  }

  const { user, token } = await usernameLogin({
    username,
    avatar: avatarURL,
    notificationAccount: email
  });

  setCookie(res, token);

  return {
    user,
    token
  };
}

export default NextAPI(handler);
