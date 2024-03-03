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

export default async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  try {
    await connectToDatabase();
    const { type, code, inviterId, callbackUrl, tmbId } = req.body as OauthLoginProps;

    const { username, avatarUrl } = await (async () => {
      if (type === OAuthEnum.github) return authGithub(code);
      if (type === OAuthEnum.google) return authGoogle(code, callbackUrl);
      if (type === OAuthEnum.wechat) return authWechat(code);
      return Promise.reject('type error');
    })();

    const { user, token } = await usernameLogin({
      username,
      avatar: avatarUrl,
      inviterId,
      tmbId
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

export async function authGithub(code: string) {
  const { data: gitAccessToken } = await axios.post<string>(
    `https://github.com/login/oauth/access_token?client_id=${global.systemConfig.auth?.github?.clientId}&client_secret=${global.systemConfig.auth?.github?.secret}&code=${code}`
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
  }>('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${access_token}`
    }
  });
  const { login, avatar_url } = data;
  const username = `git-${login}`;

  return {
    avatarUrl: avatar_url,
    username
  };
}

export async function authGoogle(code: string, callbackUrl: string) {
  const { data } = await axios.post<{ id_token: string }>(
    `https://oauth2.googleapis.com/token?client_id=${global.systemConfig?.auth?.google?.clientId}&client_secret=${global.systemConfig?.auth?.google?.secret}&code=${code}&redirect_uri=${callbackUrl}&grant_type=authorization_code`
  );

  const { sub, picture } = jwt.decode(data.id_token) as {
    sub: string;
    picture: string;
  };

  if (!sub) throw new Error('fail to get google openid');

  const username = `google-${sub}`;

  return {
    avatarUrl: picture,
    username
  };
}

export async function authWechat(code: string) {
  const { data } = await axios.get(
    `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${global.systemConfig.auth?.wechat?.appID}&secret=${global.systemConfig.auth?.wechat?.appSecret}`,
    { headers: { Accept: 'application/json' } }
  );
  const { access_token } = data;
  const { data: userInfo } = await axios.get(
    `https://api.weixin.qq.com/cgi-bin/user/info?access_token=${access_token}&openid=${code}&lang=zh_CN`
  );

  if (!userInfo.openid) {
    throw new Error('Failed to obtain WeChat information');
  }

  const username = `wechat-${userInfo.username}`;

  return {
    avatarUrl: userInfo.headimgurl,
    username
  };
}
