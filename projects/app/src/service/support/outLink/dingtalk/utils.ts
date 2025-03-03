import { retryFn } from '@fastgpt/global/common/system/utils';
import axios from 'axios';
import crypto from 'crypto';

export function verifySignature(signature: string, timestamp: string, clientSecret: string) {
  const data = `${timestamp}\n${clientSecret}`;
  const hash = crypto.createHmac('sha256', clientSecret).update(data).digest('base64');
  return hash === signature;
}

export async function replyMessage({
  webhook,
  replyContent,
  title = 'Bot Reply'
}: {
  webhook: string;
  replyContent: string;
  title?: string;
}) {
  return retryFn(() =>
    axios.post(webhook, {
      msgtype: 'markdown',
      markdown: {
        title,
        text: replyContent
      }
    })
  );
}
