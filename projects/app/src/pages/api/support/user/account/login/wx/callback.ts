import { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import xml2js from 'xml2js';
import { UserAuthTypeEnum } from '@fastgpt/global/support/user/auth/constants';
import { addAuthCode } from '@fastgpt/service/support/user/auth/controller';

type MessageType = 'event' | 'text' | 'image';
type EventType = 'SCAN' | 'subscribe';
type WechatMessage = {
  ToUserName: string[];
  FromUserName: string[];
  CreateTime: number[];
  MsgType: [MessageType];
  Event: [EventType];
  EventKey: string[];
  Content: string[];
};
type WeChatRequest = {
  signature: string;
  timestamp: string;
  nonce: string;
  echostr: string;
};
const WX_AUTH_TOKEN = 'THEAIDATASETPLATFORM';

/* config wx login verify */
function verifyWeChatRequest(req: NextApiRequest) {
  const { signature, timestamp, nonce, echostr } = req.query as WeChatRequest;
  const tmpArr = [WX_AUTH_TOKEN, timestamp, nonce];
  tmpArr.sort();
  const tmpStr = tmpArr.join('');
  const encryptedStr = crypto.createHash('sha1').update(tmpStr).digest('hex');
  if (encryptedStr === signature) {
    return echostr;
  } else {
    return false;
  }
}

export const createLoginAuthCode = ({ openid, code }: { openid: string; code: string }) => {
  return addAuthCode({
    key: code,
    openid,
    type: UserAuthTypeEnum.wxLogin
  });
};

class WeChatEventHandler {
  private handlers: { [key in EventType]: (message: WechatMessage) => Promise<string> };
  constructor() {
    this.handlers = {
      subscribe: this.handleSubscribeEvent,
      SCAN: this.handleScanEvent
    };
  }
  async handleEvent(message: WechatMessage) {
    const eventType = message.Event[0];
    const handler = this.handlers[eventType];
    if (handler) {
      return handler(message);
    }
  }
  async handleSubscribeEvent(message: WechatMessage) {
    const openid = message.FromUserName[0];
    const code = message.EventKey[0]?.replace('qrscene_', '');
    if (openid && code) {
      await createLoginAuthCode({
        openid,
        code
      });
    }
    return 'success';
  }
  async handleScanEvent(message: WechatMessage) {
    const openid = message.FromUserName[0];
    const code = message.EventKey[0];

    if (openid && code) {
      await createLoginAuthCode({
        openid,
        code
      });
    }
    return 'success';
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const str = verifyWeChatRequest(req);
      return res.send(str);
    }

    const result: { xml: WechatMessage } = await xml2js.parseStringPromise(req.body);
    let message = result.xml;
    const msgType = message.MsgType[0];

    if (msgType === 'event') {
      const eventHandler = new WeChatEventHandler();
      await eventHandler.handleEvent(message);
    }

    res.send('success');
  } catch (error) {
    console.log(error);
    res.send('failed');
  }
}
