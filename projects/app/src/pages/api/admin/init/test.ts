import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { checkFreeAccount } from '@/service/support/user/team/timerTask/freeAccount';
import { notifyAllExpireSoon } from '@/service/support/user/team/timerTask/expireSoon';

export type testQuery = {};

export type testBody = {};

export type testResponse = {};

async function handler(
  req: ApiRequestProps<testBody, testQuery>,
  res: ApiResponseType<any>
): Promise<testResponse> {
  await authCert({ req, authRoot: true });

  notifyAllExpireSoon();
  return {};
}

export default NextAPI(handler);
