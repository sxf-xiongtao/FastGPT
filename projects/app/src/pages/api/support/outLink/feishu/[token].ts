import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import type { FeishuAppType } from '@fastgpt/global/support/outLink/type';
import { authOutLinkValid } from '@fastgpt/service/support/permission/publish/authLink';
import {
  decryptoFeishu,
  getTenantAccesssToken,
  replyMessage,
  signatureVerification
} from '@/service/support/outLink/feishu/utils';
import { outlinkInvokeChat } from '@/service/support/outLink/utils';
import { addLog } from '@fastgpt/service/common/system/log';

// Request type from feishu
type EncryptedProps = { encrypt: string };

type EventProps = {
  schema: string;
  header: {
    event_id: string;
    token: string;
    create_time: string;
    event_type: string;
    tenant_key: string;
    app_id: string;
  };
  event: {
    message: {
      chat_id: string; // chat window id
      chat_type: string; // p2p / group
      content: string;
      create_time: string;
      message_id: string;
      message_type: string;
      update_time: string;
      thread_id?: string; // 话题组特有
    };
    sender: {
      sender_id: {
        open_id: string;
        union_id: string;
        user_id: string;
      };
      sender_type: string;
      tenant_key: string;
    };
  };
};

type ChallengeProps = {
  challenge: string;
  token: string;
  type: 'url_verification';
};

type Props = ChallengeProps | EventProps;

export type FeishuQuery = { token: string };
export type FeishuBody = EncryptedProps | Props;

export type FeishuResponse = {};

// handle feishu outlink request
// Verifying the request with challenge param is necessary.
// refer to: https://open.feishu.cn/document/server-docs/event-subscription-guide/event-subscription-configure-/request-url-configuration-case
async function handler(
  req: ApiRequestProps<FeishuBody, FeishuQuery>,
  _res: ApiResponseType<any>
): Promise<FeishuResponse> {
  const { token } = req.query;
  const { appId, outLinkConfig } = await authOutLinkValid<FeishuAppType>({ shareId: token });

  if (!appId) {
    return Promise.reject('No appId found');
  }

  const encryptKey = outLinkConfig?.app?.encryptKey;

  // decrypt the message sent from feishu server if it is encrypted
  // or just return the body without any modification
  const data = (() => {
    const type = Object.keys(req.body).includes('encrypt') ? 'encrypted' : 'unencrypted';

    if (!encryptKey && type === 'encrypted') {
      return Promise.reject('No encrypt key found');
    }

    if (type === 'encrypted' && encryptKey) {
      const body = req.body as EncryptedProps;
      return decryptoFeishu<Props>(body.encrypt, encryptKey);
    }
    return req.body as Props;
  })();

  if (data && (data as ChallengeProps)?.type === 'url_verification') {
    // this will return data to open source version
    return {
      challenge: (data as ChallengeProps).challenge
    };
  }

  const isSignatureValid = signatureVerification({
    timestamp: req.headers['x-lark-request-timestamp'] as string,
    nonce: req.headers['x-lark-request-nonce'] as string,
    signature: req.headers['x-lark-signature'] as string,
    encryptKey,
    body: JSON.stringify(req.body)
  });

  if (!isSignatureValid) {
    return Promise.reject('Signature Verification failed');
  }

  // if signature verified, we can assume that we recieved the message.

  const event = (data as EventProps).event; // HACK

  if (!event.message) {
    addLog.warn(`feishu message error, not message`, {
      event
    });
    return 'ok';
  }

  const chatId = (() => {
    // 特殊情况
    if (!event.message?.chat_id) {
      return event.message.message_id;
    }
    // 个人对话框/普通群：thread_id为空；话题群：thread_id不为空
    return `${event.message.chat_id}-${event.message.thread_id}`;
  })();

  const question = (() => {
    const text = JSON.parse(event.message.content).text as string;
    // 如果开头是“@_user_1”字符串，则认为是@用户提问，需要将@用户名去掉
    return text.replace(/^@_user_1 /, '');
  })();

  outlinkInvokeChat({
    // res,
    chatId,
    userQuestion: question,
    outLinkConfig,
    chatUserId: event.sender.sender_id.union_id,
    replyCallback: async (replyContent: string) =>
      replyMessage({
        message_id: event.message.message_id,
        accessToken: await getTenantAccesssToken({
          appSecret: outLinkConfig.app.appSecret,
          appId: outLinkConfig.app.appId
        }),
        replyContent
      }),
    messageId: event.message.message_id
  });

  return 'ok';
}

export default NextAPI(handler);
