import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import type { AuthOutLinkResponse } from '@fastgpt/global/support/outLink/api.d';
import { authOutLinkInit } from '@/service/support/outLink/auth';
import { authCert } from '@fastgpt/service/support/permission/auth/common';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    await authCert({ req, authRoot: true });

    jsonRes<AuthOutLinkResponse>(res, { data: await authOutLinkInit(req.body) });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
