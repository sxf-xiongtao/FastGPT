import type { NextApiResponse } from 'next';

import { ConcatUsageProps } from '@fastgpt/global/support/wallet/usage/api.d';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { concatUsage } from '@fastgpt/service/support/wallet/usage/controller';
import { NextAPI } from '@/service/middleware/entry';
import { ApiRequestProps } from '@fastgpt/service/type/next';

async function handler(req: ApiRequestProps<ConcatUsageProps>, res: NextApiResponse) {
  await authCert({ req, authRoot: true });

  await concatUsage(req.body);
}

export default NextAPI(handler);
