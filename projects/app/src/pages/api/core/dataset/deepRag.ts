import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { SearchDatasetDataProps } from '@fastgpt/service/core/dataset/search/controller';
import { authCert } from '@fastgpt/service/support/permission/auth/common';

export type deepRagQuery = {};

export type deepRagBody = SearchDatasetDataProps;

export type deepRagResponse = {};

async function handler(
  req: ApiRequestProps<deepRagBody, deepRagQuery>,
  res: ApiResponseType<any>
): Promise<deepRagResponse> {
  await authCert({
    req,
    authRoot: true
  });
  return global.deepRagHandler(req.body);
}

export default NextAPI(handler);
