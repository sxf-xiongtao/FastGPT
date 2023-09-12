import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@/service/response';
import axios from 'axios';
import { parseQueryString } from '@/utils/tools';
import { connectToDatabase } from '@/service/mongo';
import jwt from 'jsonwebtoken';
import { generateToken, setCookie } from '@/service/utils/tools';
import { sendInform2User } from '@/service/inform';
import { findUserByUsername, createUserByUsername } from '@/service/account';
import { customAlphabet } from 'nanoid';
const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz1234567890', 8);
import { createHashPassword } from '@/utils/tools';

export default async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  try {
    await connectToDatabase();
    const { type, code, inviterId } = req.query as {
      type: 'github' | 'google';
      code: string;
      inviterId?: string;
    };

    const { username, avatarUrl } = await (async () => {
      if (type === 'github') return authGithub(code);
      if (type === 'google') return authGoogle(code);
      return Promise.reject('type error');
    })();

    try {
      // try to login
      const user = await findUserByUsername({ username });
      const token = generateToken(user._id);
      setCookie(res, token);
      jsonRes(res, {
        data: { user, token }
      });
    } catch (err: any) {
      // if login failed, try to register
      if (err?.code === 501) {
        const password = nanoid();
        const user = await createUserByUsername({
          username,
          password: createHashPassword(password),
          avatar: avatarUrl,
          inviterId
        });
        // send default password inform
        sendInform2User({
          userId: user._id,
          type: 'system',
          title: '新用户注册',
          content: `您的初始密码为: ${password}`
        });
        const token = generateToken(user._id);
        setCookie(res, token);
        return jsonRes(res, {
          data: { user, token }
        });
      }
      // api error
      throw new Error(err);
    }
  } catch (err) {
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

export async function authGoogle(code: string) {
  async function getBase64FromRemote(url: string) {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const blobToBase64 = (blob: Blob) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onload = () => {
            const dataUrl = reader.result;
            resolve(dataUrl);
          };
          reader.onerror = (error) => {
            reject(error);
          };
        });

      return await blobToBase64(blob);
    } catch {
      return '';
    }
  }

  const { data } = await axios.post<{ id_token: string }>(
    `https://oauth2.googleapis.com/token?client_id=${
      global.systemConfig?.auth?.google?.clientId
    }&client_secret=${
      global.systemConfig?.auth?.google?.secret
    }&code=${code}&redirect_uri=${`callbackUrl`}&grant_type=authorization_code`
  );

  const { name, sub, picture } = jwt.decode(data.id_token) as {
    sub: string;
    name: string;
    picture: string;
  };

  const avatar_url = (await getBase64FromRemote(picture)) as string;
  if (!sub) throw new Error('fail to get google openid');

  const username = `google-${name}`;

  return {
    avatarUrl: avatar_url,
    username
  };
}
