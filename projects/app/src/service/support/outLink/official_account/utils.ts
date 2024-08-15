import { decrypt } from '@wecom/crypto';
import crypto from 'crypto';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';

const Parser = new XMLParser();

export function getSignature(token: string, timestamp: string, nonce: string): string {
  const arr = [token, timestamp, nonce].sort();
  const str = arr.join('');
  const sha1 = crypto.createHash('sha1');
  sha1.update(str);
  return sha1.digest('hex');
}

export async function parseBody<T>(
  raw: string,
  AesKey?: string
): Promise<
  {
    toUserName: string;
    AgentID: string;
  } & T
> {
  const { xml: body } = await Parser.parse(raw);
  if (!AesKey) {
    return {
      toUserName: '',
      AgentID: '',
      ...body
    };
  }

  const Encrypt = body?.Encrypt as string;
  if (!Encrypt) {
    throw new Error('Encrypt not found');
  }

  const { message, id, random } = decrypt(AesKey, Encrypt); // HACK: decrypt is provided by @wecom/crypto, but this is called by wechat
  const { xml: data } = await Parser.parse(message);

  return {
    toUserName: data.ToUserName,
    ID: id,
    Random: random,
    ...data
  };
}

export function passiveReply({
  toUserName,
  fromUserName,
  content
}: {
  toUserName: string;
  fromUserName: string;
  content: string;
}): string {
  return `
<xml>
  <ToUserName><![CDATA[${toUserName}]]></ToUserName>
  <FromUserName><![CDATA[${fromUserName}]]></FromUserName>
  <CreateTime>${Date.now()}</CreateTime>
  <MsgType><![CDATA[text]]></MsgType>
  <Content><![CDATA[${content}]]></Content>
</xml>
`;
}
