import { NextApiResponse } from 'next';
import { MongoUserAuth } from '@/service/support/user/auth/schema';
import axios from 'axios';
import { UserAuthTypeEnum } from '@fastgpt/global/support/user/auth/constants';
import { usernameLogin } from '@/service/support/user/controller';
import { WxLoginProps } from '@fastgpt/global/support/user/api';
import { setCookie } from '@fastgpt/service/support/permission/controller';
import { getWechatLoginConfig } from '@/service/support/user/login/wx';
import { NextAPI } from '@/service/middleware/entry';
import { ApiRequestProps } from '@fastgpt/service/type/next';
import type { UserType } from '@fastgpt/global/support/user/type';

export async function authWechat(openid: string) {
  const { APP_ID, APP_SECRET } = await getWechatLoginConfig();
  const { data } = await axios.get(
    `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${APP_ID}&secret=${APP_SECRET}`,
    { headers: { Accept: 'application/json' } }
  );
  const { data: userInfo } = await axios.get(
    `https://api.weixin.qq.com/cgi-bin/user/info?access_token=${data.access_token}&openid=${openid}&lang=zh_CN`
  );

  if (!userInfo.openid) {
    throw new Error('Failed to obtain WeChat information');
  }

  const username = `wechat-${userInfo.openid}`;

  return {
    avatarUrl: userInfo.headimgurl,
    username
  };
}

async function handler(
  req: ApiRequestProps<{}, WxLoginProps>,
  res: NextApiResponse
): Promise<
  | {
      user: UserType;
      token: string;
    }
  | undefined
> {
  const { code, inviterId } = req.query;

  if (!code) {
    return;
  }

  const verifyInfo = await MongoUserAuth.findOne({
    key: code,
    type: UserAuthTypeEnum.wxLogin
  });

  if (!verifyInfo?.openid) {
    return;
  }
  const { username, avatarUrl } = await authWechat(verifyInfo.openid);

  const { user, token } = await usernameLogin({
    username,
    avatar: avatarUrl,
    inviterId
  });

  setCookie(res, token);
  return { user, token };
}

export default NextAPI(handler);
