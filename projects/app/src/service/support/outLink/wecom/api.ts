import { TmpDataEnum } from '@fastgpt/global/support/tmpData/constant';
import { setTmpData } from '@fastgpt/service/support/tmpData/controller';
import axios from 'axios';

const getSuiteAccessTokenURL = 'https://qyapi.weixin.qq.com/cgi-bin/gettoken';
const sendMessageURL = 'https://qyapi.weixin.qq.com/cgi-bin/message/send';

export async function getAccessToken({
  CorpId,
  AgentId,
  SuiteSecret
}: {
  CorpId: string;
  AgentId: string;
  SuiteSecret: string;
}) {
  // WARN: Ticket is not nessceary for now. it is used to get token when the app is a '第三方应用'.
  // const tmpData = await getTmpData({
  //   type: TmpDataEnum.WecomSuiteAccessToken,
  //   metadata: {
  //     CorpId,
  //     AgentId
  //   }
  // });
  // if (tmpData) {
  //   return tmpData.data.suiteAccessToken;
  // }
  // // 1. get the ticket
  // const ticketData = await getTmpData({
  //   type: TmpDataEnum.WecomSuiteTicket,
  //   metadata: {
  //     CorpId,
  //     AgentId
  //   }
  // });
  // if (!ticketData) {
  //   throw new Error('No suite ticket found');
  // }

  const res = await axios.request<{
    errcode?: number;
    errmsg: string;
    access_token: string;
    expires_in: number; // seconds
  }>({
    url: getSuiteAccessTokenURL,
    method: 'POST',
    data: {
      corpid: CorpId,
      corpsecret: SuiteSecret
    }
  });

  if (res.data.errcode) {
    throw new Error(res.data.errmsg);
  }
  // save to tmpData
  await setTmpData({
    type: TmpDataEnum.WecomAccessToken,
    data: {
      accessToken: res.data.access_token
    },
    metadata: {
      CorpId,
      AgentId
    }
  });

  return res.data.access_token;
}

export async function replyMessage({
  access_token,
  content,
  touser,
  agentid
}: {
  content: string;
  access_token: string;
  touser: string;
  agentid: string;
}) {
  // WARN: According to https://developer.work.weixin.qq.com/document/path/91039
  // 企业微信可能会出于运营需要，提前使access_token失效，开发者应实现access_token失效时重新获取的逻辑。
  const res = await axios.request({
    url: sendMessageURL,
    method: 'POST',
    params: {
      access_token
    },
    data: {
      touser,
      msgtype: 'text',
      agentid,
      text: {
        content
      }
    }
  });

  if (res.data.errcode === 0) {
    return 0;
  }

  if (res.data.errcode === 40014) {
    // access_token failed
    return 40014;
  }
}
