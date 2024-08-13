import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { CreateUsageProps } from '@fastgpt/global/support/wallet/usage/api.d';
import { addLog } from '@fastgpt/service/common/system/log';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { createUsage } from '@/service/support/wallet/usage/push';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    await authCert({ req, authRoot: true });
    const data = req.body as CreateUsageProps;

    await createUsage(data);

    jsonRes(res);
  } catch (err) {
    addLog.error('Create Usage Error', err);

    jsonRes(res);
  }
}
