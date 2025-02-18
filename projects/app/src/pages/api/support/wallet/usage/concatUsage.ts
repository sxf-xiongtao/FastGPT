import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { ConcatUsageProps } from '@fastgpt/global/support/wallet/usage/api.d';
import { addLog } from '@fastgpt/service/common/system/log';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { concatUsage } from '@fastgpt/service/support/wallet/usage/controller';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    await authCert({ req, authRoot: true });
    const body = req.body as ConcatUsageProps;

    await concatUsage(body);

    jsonRes(res);
  } catch (err) {
    addLog.error('Push Concat Usage Error', err);
    console.log(err);

    jsonRes(res);
  }
}
