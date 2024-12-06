import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import axios from 'axios';
import { parseQueryString } from '@/utils/tools';
import { connectToDatabase } from '@/service/mongo';
import jwt from 'jsonwebtoken';
import { setCookie } from '@fastgpt/service/support/permission/controller';
import { usernameLogin } from '@/service/support/user/controller';
import { OAuthEnum } from '@fastgpt/global/support/user/constant';
import type { OauthLoginProps } from '@fastgpt/global/support/user/api';
import { UserErrEnum } from '@fastgpt/global/common/error/code/user';

type OauthResponse = {
  username: string;
  avatarUrl?: string;
  concat?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  try {
    await connectToDatabase();
    const { type, code, inviterId, callbackUrl } = req.body as OauthLoginProps;

    const { username, avatarUrl, concat } = await (async () => {
      if (type === OAuthEnum.github) return authGithub(code);
      if (type === OAuthEnum.google) return authGoogle(code, callbackUrl);
      if (type === OAuthEnum.microsoft) return authMicrosoft(code, callbackUrl);
      if (type === OAuthEnum.sso) return authSso(code);
      return Promise.reject('type error');
    })();

    const { user, token } = await usernameLogin({
      username,
      avatar: avatarUrl,
      notificationAccount: concat,
      inviterId
    });

    setCookie(res, token);
    jsonRes(res, {
      data: { user, token }
    });
  } catch (err) {
    console.log(err);

    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}

export async function authGithub(code: string): Promise<OauthResponse> {
  const { data: gitAccessToken } = await axios.post<string>(
    `https://github.com/login/oauth/access_token?client_id=${global.systemConfig.auth?.github?.clientId}&client_secret=${global.systemConfig.auth?.github?.secret}&code=${code}&scope=user:email`
  );
  const jsonGitAccessToken = parseQueryString(gitAccessToken) as {
    access_token: string;
  };

  const access_token = jsonGitAccessToken?.access_token;
  if (!access_token) {
    throw new Error('access_token is null');
  }

  const { data } = await axios.get<{
    login: string;
    avatar_url: string;
    email?: string;
  }>('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${access_token}`
    }
  });

  const username = `git-${data.login}`;

  return {
    avatarUrl: data.avatar_url,
    username,
    concat: data.email
  };
}

export async function authGoogle(code: string, callbackUrl: string): Promise<OauthResponse> {
  const { data } = await axios.post<{ id_token: string }>(
    `https://oauth2.googleapis.com/token?client_id=${global.systemConfig?.auth?.google?.clientId}&client_secret=${global.systemConfig?.auth?.google?.secret}&code=${code}&redirect_uri=${callbackUrl}&grant_type=authorization_code`
  );

  const result = jwt.decode(data.id_token) as {
    sub: string;
    picture: string;
    email: string;
  };

  const { sub, picture, email } = result;

  if (!sub) throw new Error('fail to get google openid');

  const username = `google-${sub}`;

  return {
    avatarUrl: picture,
    username,
    concat: email
  };
}

export async function authMicrosoft(code: string, callbackUrl: string): Promise<OauthResponse> {
  const { data: tokenData } = await axios.post<{
    access_token: string;
    refresh_token: string;
  }>(
    `https://login.microsoftonline.com/${global.systemConfig?.auth?.microsoft?.tenantId || 'common'}/oauth2/v2.0/token`,
    new URLSearchParams({
      client_id: global.systemConfig?.auth?.microsoft?.clientId || '',
      client_secret: global.systemConfig?.auth?.microsoft?.secret || '',
      scope: 'https://graph.microsoft.com/user.read',
      code: code,
      redirect_uri: callbackUrl,
      grant_type: 'authorization_code'
    })
  );

  const { data: userData } = await axios.get<{
    id: string;
    userPrincipalName: string;
    displayName: string;
    mail?: string;
  }>('https://graph.microsoft.com/v1.0/me', {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`
    }
  });

  if (!userData.id) {
    throw new Error('Fail to get microsoft user info');
  }

  const username = `microsoft-${userData.id}`;

  return {
    avatarUrl: '',
    username,
    concat: userData.mail || userData.userPrincipalName
  };
}

/* 
  通用 SSO 登录封装
*/
export async function authSso(code: string): Promise<OauthResponse> {
  if (!global.feConfigs?.sso || !global.feConfigs?.sso?.url)
    return Promise.reject('Not config sso');

  if (!code) return Promise.reject('Not found code');

  const { data } = await axios.get<{
    success: boolean;
    message?: string;
    username: string;
    avatar?: string;
    contact?: string;
  }>(`${global.feConfigs.sso.url}/login/oauth/access_token?code=${code}`);

  if (!data.success) {
    return Promise.reject(data.message || UserErrEnum.unAuthSso);
  }

  return {
    avatarUrl: data.avatar,
    username: data.username,
    concat: data.contact
  };
}
