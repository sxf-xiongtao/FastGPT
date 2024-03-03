import { jsonRes } from '@fastgpt/service/common/response';
import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/service/mongo';
import { MongoUserAuth } from '@/service/support/user/auth/schema';
import axios from 'axios';
import { UserAuthTypeEnum } from '@fastgpt/global/support/user/auth/constants';
import { usernameLogin } from '@/service/support/user/controller';
import { WxLoginProps } from '@fastgpt/global/support/user/api';
import { setCookie } from '@fastgpt/service/support/permission/controller';
import { getWechatLoginConfig } from '@/service/support/user/login/wx';

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { code, inviterId } = req.query as WxLoginProps;

    if (!code) {
      throw new Error('code is required');
    }

    await connectToDatabase();

    const verifyInfo = await MongoUserAuth.findOne({
      key: code,
      type: UserAuthTypeEnum.wxLogin
    });

    if (!verifyInfo?.openid) {
      throw new Error('Not found code');
    }
    const { username, avatarUrl } = await authWechat(verifyInfo.openid);

    const { user, token } = await usernameLogin({
      username,
      avatar: avatarUrl,
      inviterId
    });

    setCookie(res, token);
    jsonRes(res, {
      data: { user, token }
    });
  } catch (error) {
    jsonRes(res, {
      code: 500,
      error
    });
  }
}
