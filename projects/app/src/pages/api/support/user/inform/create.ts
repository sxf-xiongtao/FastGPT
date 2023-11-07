// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import type { SendInformProps } from '@fastgpt/global/support/user/inform/type';
import { sendInform2AllUser, sendInform2OneUser } from '@/service/support/user/inform/controller';
import { startSendInform } from '@/service/queue/sendInform';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    const { tmbId, type, title, content } = req.body as SendInformProps;
    await authCert({ req, authRoot: true });

    if (!tmbId) {
      sendInform2AllUser({
        type,
        title,
        content
      });
    } else {
      // create one unactive inform
      global.sendInformQueue.push(() => sendInform2OneUser({ type, title, content, tmbId }));
      startSendInform();
    }

    jsonRes(res, {
      message: '发送通知成功'
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
