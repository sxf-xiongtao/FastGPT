import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import type { SendInformProps } from '@fastgpt/global/support/user/inform/type';
import { sendInform2AllUser } from '@/service/support/user/inform/controller';
import { adminCert } from '@/service/support/permission/adminCert';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    const { title, content, level } = req.body as SendInformProps;
    await adminCert({ req, authToken: true });

    sendInform2AllUser({
      title,
      content,
      level
    });

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
