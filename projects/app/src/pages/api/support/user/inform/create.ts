// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import type { SendInform2UserProps } from '@fastgpt/global/support/user/inform/type';
import { sendInform2OneUser } from '@/service/support/user/inform/controller';
import { startSendInform } from '@/service/queue/sendInform';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    const { tmbId, title, content, level } = req.body as SendInform2UserProps;
    await authCert({ req, authRoot: true });

    // create one unactive inform
    global.sendInformQueue.push(() => sendInform2OneUser({ title, content, tmbId, level }));
    startSendInform();

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
