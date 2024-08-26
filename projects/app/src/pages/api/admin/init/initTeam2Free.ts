import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { MongoTeamSub } from '@fastgpt/service/support/wallet/sub/schema';
import { initTeamStandardPlan2Free } from '@fastgpt/service/support/wallet/sub/utils';

export type initTeam2FreeQuery = {};

export type initTeam2FreeBody = {};

export type initTeam2FreeResponse = {};

async function handler(
  req: ApiRequestProps<initTeam2FreeBody, initTeam2FreeQuery>,
  res: ApiResponseType<any>
): Promise<initTeam2FreeResponse> {
  await authCert({ req, authRoot: true });

  const { teamId } = req.body as { teamId: string };

  await MongoTeamSub.deleteMany({ teamId });
  await initTeamStandardPlan2Free({ teamId });

  return {};
}

export default NextAPI(handler);
