import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { checkFreeAccount } from '@/service/support/user/team/timerTask/freeAccount';
import { notifyAllExpireSoon } from '@/service/support/user/team/timerTask/expireSoon';
import { MongoTeamSub } from '@fastgpt/service/support/wallet/sub/schema';
import { StandardSubLevelEnum, SubTypeEnum } from '@fastgpt/global/support/wallet/sub/constants';
import { addDays, addSeconds } from 'date-fns';
import { readFromSecondary } from '@fastgpt/service/common/mongo/utils';
import { MongoUserInform } from '@/service/support/user/inform/schema';

export type testQuery = {};

export type testBody = {};

export type testResponse = {};

async function handler(
  req: ApiRequestProps<testBody, testQuery>,
  res: ApiResponseType<any>
): Promise<testResponse> {
  await authCert({ req, authRoot: true });
  const { expiredDay = 30, day } = req.body as { expiredDay?: number; day?: number };

  checkFreeAccount(expiredDay, day);
  return {};
}

export default NextAPI(handler);
