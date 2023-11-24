import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { AppSimpleEditConfigTemplateType } from '@fastgpt/global/core/app/type';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    await authCert({ req, authRoot: true });

    jsonRes<AppSimpleEditConfigTemplateType[]>(res, {
      data: []
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
