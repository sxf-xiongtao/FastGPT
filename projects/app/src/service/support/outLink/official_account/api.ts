import { TmpDataEnum } from '@fastgpt/global/support/tmpData/constant';
import { setTmpData } from '@fastgpt/service/support/tmpData/controller';
import axios from 'axios';

const getStableAccessTokenURL = 'https://api.weixin.qq.com/cgi-bin/stable_token';
const replyURL = 'https://api.weixin.qq.com/cgi-bin/message/custom/send';

export async function getAccessToken({ appId, secret }: { appId: string; secret: string }) {
  const res = await axios.request<{
    errcode?: number;
    errmsg: string;
    access_token: string;
    expires_in: number; // seconds
  }>({
    url: getStableAccessTokenURL,
    method: 'POST',
    data: {
      grant_type: 'client_credential',
      appid: appId,
      secret
    }
  });

  if (res.data.errcode) {
    throw new Error(res.data.errmsg);
  }
  // save to tmpData
  await setTmpData({
    type: TmpDataEnum.OffiAccountAccessToken,
    data: {
      accessToken: res.data.access_token
    },
    metadata: {
      AppId: appId
    }
  });

  return res.data.access_token;
}

// this api need the provided official accound to be verified
export async function requestReply({
  toUserName,
  content,
  access_token
}: {
  toUserName: string;
  content: string;
  access_token: string;
}) {
  return axios
    .request<{
      errcode: number;
      errmsg: string;
    }>({
      url: replyURL,
      method: 'POST',
      data: {
        touser: toUserName,
        msgtype: 'text',
        text: {
          content
        }
      },
      params: {
        access_token
      }
    })
    .then((res) => res.data);
}
