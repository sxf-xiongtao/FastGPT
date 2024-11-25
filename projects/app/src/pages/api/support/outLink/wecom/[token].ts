import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { authOutLinkValid } from '@fastgpt/service/support/permission/publish/authLink';
import { WecomAppType } from '@fastgpt/global/support/outLink/type';
import { getSignature, decrypt } from '@wecom/crypto';
import { parseBody } from '@/service/support/outLink/wecom/utils';
import { getAccessToken, replyMessage } from '@/service/support/outLink/wecom/api';
import { outlinkInvokeChat } from '@/service/support/outLink/utils';

export type OutLinkWecomQuery = {
  token: string;
  type: 'data' | 'command';
  msg_signature: string;
  timestamp: string;
  nonce: string;
  echostr?: string;
};
export type OutLinkWecomBody = string;
export type OutLinkWecomResponse = {};

type Body = {
  FromUserName: string;
  Content: string;
  MsgId: string;
  MsgType: 'text'; // only support text for now
};

async function handler(
  req: ApiRequestProps<OutLinkWecomBody, OutLinkWecomQuery>,
  _res: ApiResponseType<any>
): Promise<OutLinkWecomResponse> {
  const { token, msg_signature, timestamp, nonce, echostr } = req.query;
  const { outLinkConfig } = await authOutLinkValid<WecomAppType>({ shareId: token });
  const { CallbackEncodingAesKey, CallbackToken, AgentId, SuiteSecret, CorpId } = outLinkConfig.app;

  // handle challenge
  if (echostr) {
    const signature = getSignature(CallbackToken, timestamp, nonce, echostr);
    if (signature === msg_signature) {
      const { message } = decrypt(CallbackEncodingAesKey, echostr);
      return { message };
    }
  }

  // handle message
  const body = await parseBody<Body>(req.body, CallbackEncodingAesKey);
  if (body.MsgType !== 'text') {
    // only support text for now
    return {};
  }

  const accessToken = await getAccessToken({
    CorpId,
    AgentId,
    SuiteSecret
  });

  const chatId = CorpId + body.FromUserName;

  outlinkInvokeChat({
    chatId,
    outLinkConfig,
    messageId: body.MsgId,
    userQuestion: body.Content,
    chatUserId: body.FromUserName,
    replyCallback: async (content: string) => {
      replyMessage({
        agentid: AgentId,
        access_token: accessToken,
        touser: body.FromUserName,
        content
      });
    }
  });
  return {};
}

export default NextAPI(handler);
