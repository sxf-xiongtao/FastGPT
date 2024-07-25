import type { NextApiRequest, NextApiResponse } from 'next';
import type { AuthOpenApiLimitProps } from '@fastgpt/service/support/openapi/auth';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { NextAPI } from '@/service/middleware/entry';
import { ApiRequestProps } from '@fastgpt/service/type/next';

async function handler(req: ApiRequestProps<AuthOpenApiLimitProps>, res: NextApiResponse) {
  await authCert({ req, authRoot: true });
  const { openApi } = req.body;

  // expiredTime already 2 string
  if (openApi?.limit?.expiredTime && new Date(openApi.limit.expiredTime).getTime() < Date.now()) {
    return Promise.reject(`Key ${openApi.apiKey} is expired`);
  }
  if (
    openApi?.limit?.maxUsagePoints &&
    openApi.limit.maxUsagePoints > -1 &&
    openApi.usagePoints > openApi.limit.maxUsagePoints
  ) {
    return Promise.reject(`Key ${openApi.apiKey} is over usage`);
  }

  return;
}

export default NextAPI(handler);
