import axios from 'axios';

export const getWechatLoginConfig = async () => {
  const APP_ID = global.systemConfig?.auth?.wechat?.appID;
  const APP_SECRET = global.systemConfig?.auth?.wechat?.appSecret;
  if (!APP_ID || !APP_SECRET) {
    return Promise.reject('Missing WeChat public account key');
  }
  return {
    APP_ID,
    APP_SECRET
  };
};

export const getWeChatAccessToken = async () => {
  const { APP_ID, APP_SECRET } = await getWechatLoginConfig();
  const { data } = await axios.get<{
    access_token: string;
    expires_in: number;
  }>(`https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential`, {
    params: {
      appid: APP_ID,
      secret: APP_SECRET
    }
  });

  const newAccessToken = data.access_token;

  return newAccessToken;
};
