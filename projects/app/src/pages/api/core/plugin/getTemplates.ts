import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { PluginTemplateType } from '@fastgpt/global/core/plugin/type';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    await authCert({ req, authRoot: true });

    jsonRes<PluginTemplateType[]>(res, {
      data: []
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
