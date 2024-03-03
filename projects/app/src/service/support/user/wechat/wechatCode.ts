import { connectToDatabase } from '@/service/mongo';
import { MongoCode } from '@fastgpt/service/support/user/code/schema';

export async function hasWeChatAppSecret() {
  const APP_ID = global.systemConfig?.auth?.wechat?.appID;
  const APP_SECRET = global.systemConfig?.auth?.wechat?.appSecret;
  if (!APP_ID || !APP_SECRET) {
    throw new Error('Missing WeChat public account key');
  }
  return {
    APP_ID,
    APP_SECRET
  };
}

export async function getWeChatAccessToken() {
  const { APP_ID, APP_SECRET } = await hasWeChatAppSecret();
  const response = await fetch(
    `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${APP_ID}&secret=${APP_SECRET}`,
    { headers: { Accept: 'application/json' } }
  );
  const { access_token: newAccessToken, expires_in: newExpiresIn } = (await response.json()) as {
    access_token: string;
    expires_in: number;
  };

  return newAccessToken;
}

export async function verifyWechatCode({ code }: { code: string }) {
  await connectToDatabase();
  const result = await MongoCode.findOne({
    code,
    expireTime: { $gt: new Date() }
  });
  return result;
}

export async function addOrUpdateWechatCode({ openid, code }: { openid: string; code: string }) {
  const currentTime = new Date();
  const expireTime = new Date(currentTime.getTime() + 5 * 60 * 1000);
  const result = await MongoCode.updateOne(
    {
      openid
    },
    {
      $set: {
        code,
        createTime: currentTime,
        expireTime: expireTime
      }
    },
    {
      upsert: true
    }
  );
  return result;
}
