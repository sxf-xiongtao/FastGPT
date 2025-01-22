import { TmpDataEnum } from '@fastgpt/global/support/tmpData/constant';
import { getTmpData, setTmpData } from '@fastgpt/service/support/tmpData/controller';
import axios from 'axios';
import crypto from 'crypto';
import { retryRun } from '@fastgpt/global/common/fn/utils';

const feishuBotBaseURL = process.env.FEISHU_BOT_BASE_URL || 'https://open.feishu.cn';
const getTenantURL = `${feishuBotBaseURL}/open-apis/auth/v3/tenant_access_token/internal`;
const replyURL = (message_id: string) =>
  `${feishuBotBaseURL}/open-apis/im/v1/messages/${message_id}/reply`;

// refer: https://open.feishu.cn/document/server-docs/event-subscription-guide/event-subscription-configure-/encrypt-key-encryption-configuration-case#679e4309
// the following code is copied from the above link
class AESCipher {
  key: Buffer;
  constructor(key: string) {
    const hash = crypto.createHash('sha256');
    hash.update(key);
    this.key = hash.digest();
  }
  decrypt(encrypt: string) {
    const encryptBuffer = Buffer.from(encrypt, 'base64');
    const decipher = crypto.createDecipheriv('aes-256-cbc', this.key, encryptBuffer.slice(0, 16));
    let decrypted = decipher.update(encryptBuffer.slice(16).toString('hex'), 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
//
// encrypt = "P37w+VZImNgPEO1RBhJ6RtKl7n6zymIbEG1pReEzghk="
// cipher = new AESCipher("test key")
// console.log(cipher.decrypt(encrypt))

export function decryptoFeishu<T>(encrpt: string, key: string): T {
  const cipher = new AESCipher(key);
  return JSON.parse(cipher.decrypt(encrpt));
}

export function signatureVerification({
  timestamp,
  nonce,
  signature,
  encryptKey = '',
  body
}: {
  timestamp: string;
  nonce: string;
  signature: string;
  encryptKey?: string;
  body: string;
}): boolean {
  const content = timestamp + nonce + encryptKey + body;
  const hash = crypto.createHash('sha256');
  hash.update(content);
  return hash.digest('hex') === signature;
}

// refer:https://open.feishu.cn/document/server-docs/authentication-management/access-token/tenant_access_token_internal

type getTenantResponseType = {
  code: number;
  msg: string;
  tenant_access_token: string;
  expire: number;
};

export async function getTenantAccesssToken({
  appId,
  appSecret
}: {
  appId: string; // feishu app id
  appSecret: string; // feishu app secret
}) {
  const tmpData = await getTmpData({
    metadata: {
      FeishuAppId: appId
    },
    type: TmpDataEnum.FeishuAccessToken
  });

  if (tmpData?.data?.accessToken) {
    return tmpData.data.accessToken;
  }

  // there is no token in tmpData, get the token from feishu
  const data = await axios.post<getTenantResponseType>(getTenantURL, {
    app_id: appId,
    app_secret: appSecret
  });

  if (!data || data.data.code !== 0) {
    console.error('get tenant_access_token error', data.data);
    return Promise.reject('get tenant_access_token error');
  }

  const token = data.data.tenant_access_token;

  await setTmpData({
    type: TmpDataEnum.FeishuAccessToken,
    metadata: {
      FeishuAppId: appId
    },
    data: {
      accessToken: token
    }
  });

  return token;
}

// reply the message
// refer to: https://open.feishu.cn/document/server-docs/im-v1/message/reply
export async function replyMessage({
  message_id,
  accessToken,
  replyContent
}: {
  message_id: string;
  accessToken: string;
  replyContent: string;
}) {
  return retryRun(() =>
    axios.request({
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=utf-8'
      },
      url: replyURL(message_id),
      method: 'post',
      data: {
        msg_type: 'text',
        content: JSON.stringify({
          text: replyContent
        }),
        uuid: message_id
      }
    })
  );
}
