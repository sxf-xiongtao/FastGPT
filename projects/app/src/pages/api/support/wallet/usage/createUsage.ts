import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import type { CreateUsageProps } from '@fastgpt/global/support/wallet/usage/api.d';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { createUsage } from '@fastgpt/service/support/wallet/usage/controller';
import { NextAPI } from '@/service/middleware/entry';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await authCert({ req, authRoot: true });
  const data = req.body as CreateUsageProps;

  await createUsage(data);

  jsonRes(res);
}

export default NextAPI(handler);
