import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import syncOrg from '@/service/support/user/org/sync';
import { authUserPer } from '@fastgpt/service/support/permission/user/auth';
import { TeamManagePermissionVal } from '@fastgpt/global/support/permission/user/constant';

export type OrgSyncQuery = {};
export type OrgSyncBody = {};
export type OrgSyncResponse = {};

async function handler(
  req: ApiRequestProps<OrgSyncBody, OrgSyncQuery>,
  _res: ApiResponseType<any>
): Promise<OrgSyncResponse> {
  const { teamId } = await authUserPer({
    req,
    authToken: true,
    per: TeamManagePermissionVal
  });

  await syncOrg({ teamId });
  return {};
}
export default NextAPI(handler);
