import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { authOutLinkLimit } from '@/service/support/outLink/auth';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { AuthOutLinkResponse } from '@fastgpt/global/support/outLink/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    await authCert({ req, authRoot: true });
    const body = req.body;

    jsonRes<AuthOutLinkResponse>(res, {
      data: await authOutLinkLimit(body)
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
