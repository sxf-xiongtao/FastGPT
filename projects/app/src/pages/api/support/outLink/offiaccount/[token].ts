import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { authOutLinkValid } from '@fastgpt/service/support/permission/publish/authLink';
import { OffiAccountAppType } from '@fastgpt/global/support/outLink/type';
import {
  getSignature,
  parseBody,
  passiveReply
} from '@/service/support/outLink/official_account/utils';
import { outlinkInvokeChat } from '@/service/support/outLink/utils';
import { getAccessToken, requestReply } from '@/service/support/outLink/official_account/api';

export type OutLinkOffiAccountQuery = {
  signature: string;
  timestamp: string;
  nonce: string;
  echostr?: string;
  token: string;
};
export type OutLinkOffiAccountBody = string;
export type OutLinkOffiAccountResponse = {};

type Body = {
  FromUserName: string;
  Content: string;
  MsgId: string;
  MsgType: 'text'; // only support text for now
};

async function handler(
  req: ApiRequestProps<OutLinkOffiAccountBody, OutLinkOffiAccountQuery>,
  _res: ApiResponseType<any>
): Promise<OutLinkOffiAccountResponse> {
  const { signature, timestamp, nonce, echostr, token } = req.query;
  const { shareChat } = await authOutLinkValid<OffiAccountAppType>({ shareId: token });
  const { CallbackToken, appId, secret, CallbackEncodingAesKey } = shareChat.app;

  if (echostr) {
    const decoded_signature = getSignature(CallbackToken, timestamp, nonce);
    if (signature === decoded_signature) {
      return { message: echostr };
    }
  }

  // handle message
  const body = await parseBody<Body>(req.body, CallbackEncodingAesKey);

  if (body.MsgType !== 'text') {
    // only support text for now
    return {
      message: passiveReply({
        content: `暂不支持非文字消息`,
        fromUserName: body.toUserName,
        toUserName: body.FromUserName
      })
    };
  }

  const chatId = appId + body.FromUserName;

  outlinkInvokeChat({
    chatId,
    shareChat,
    messageId: body.MsgId,
    userQuestion: body.Content,
    replyCallback: async (content: string) => {
      requestReply({
        access_token: await getAccessToken({
          appId,
          secret
        }),
        toUserName: body.FromUserName,
        content
      });
    }
  });
  return {};
}

export default NextAPI(handler);
