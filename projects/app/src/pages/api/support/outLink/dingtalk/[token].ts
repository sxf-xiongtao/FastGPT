import { NextAPI } from '@/service/middleware/entry';
import { replyMessage, verifySignature } from '@/service/support/outLink/dingtalk/utils';
import { outlinkInvokeChat } from '@/service/support/outLink/utils';
import { DingtalkAppType } from '@fastgpt/global/support/outLink/type';
import { addLog } from '@fastgpt/service/common/system/log';
import { authOutLinkValid } from '@fastgpt/service/support/permission/publish/authLink';
import { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';

export type DingtalkBody = {
  senderPlatform: string;
  conversationId: string;
  atUsers: AtUser[];
  chatbotCorpId: string;
  chatbotUserId: string;
  msgId: string;
  senderNick: string;
  isAdmin: boolean;
  senderStaffId: string;
  sessionWebhookExpiredTime: number;
  createAt: number;
  senderCorpId: string;
  conversationType: '1' | '2'; // 1: p2p, 2: group
  senderId: string;
  conversationTitle: string;
  isInAtList: boolean;
  sessionWebhook: string;
  text: Text | undefined; // text
  content: Content;
  robotCode: string | undefined;
  msgtype: MsgType;
};

export type MsgType = 'text' | 'picture' | 'richText' | 'audio' | 'video' | 'file';

export type AtUser = {
  dingtalkId: string;
};

export type Text = {
  content: string;
};

export type Content = {
  richText?: RichText[]; // richText
  downloadCode?: string; // picture, audio, video, file
  duration?: number; // audio, video
  recognition?: string; // audio
  videoType?: string; // video
  fileName?: string; // file
};

export type RichText = {
  text?: string;
  downloadCode?: string;
  type?: 'picture';
};

export type DingtalkQuery = { token: string };

async function handler(
  req: ApiRequestProps<DingtalkBody, DingtalkQuery>,
  _res: ApiResponseType<any>
): Promise<void> {
  const { token } = req.query;
  // console.log(req.body);
  // console.log(req.headers);
  const { appId, outLinkConfig } = await authOutLinkValid<DingtalkAppType>({ shareId: token });

  const { clientId, clientSecret } = outLinkConfig.app;

  // skip for GET request(Test)
  if (req.method === 'GET') {
    return;
  }

  // verify signature
  const timestamp = req.headers['timestamp'] as string;
  const sign = req.headers['sign'] as string;
  if (!verifySignature(sign, timestamp, clientSecret)) {
    addLog.warn('signature verification failed', { sign, timestamp, clientSecret });
    return Promise.reject('signature verification failed');
  }

  const {
    text,
    msgtype,
    conversationId,
    senderId,
    msgId,
    sessionWebhook,
    sessionWebhookExpiredTime
  } = req.body;
  if (msgtype !== 'text' || !text) {
    return Promise.reject('Unsupported message type: ' + msgtype);
  }

  const question = text.content;

  outlinkInvokeChat({
    outLinkConfig,
    userQuestion: question,
    chatId: conversationId,
    chatUserId: senderId,
    messageId: msgId,
    replyCallback: async (replyContent: string) =>
      replyMessage({ webhook: sessionWebhook, replyContent })
  });

  return;
}

export default NextAPI(handler);
