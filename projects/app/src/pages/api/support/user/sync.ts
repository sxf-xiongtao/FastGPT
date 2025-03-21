import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { authUserPer } from '@fastgpt/service/support/permission/user/auth';
import { TeamManagePermissionVal } from '@fastgpt/global/support/permission/user/constant';
import { syncUserAndOrg } from '@/service/support/user/sync';

export type UserSyncQuery = {};
export type UserSyncBody = {};
export type UserSyncResponse = {};

async function handler(
  req: ApiRequestProps<UserSyncBody, UserSyncQuery>,
  res: ApiResponseType<any>
): Promise<UserSyncResponse> {
  const url = global.feConfigs.sso?.url;
  if (!url) {
    return Promise.reject('SSO URL is not found');
  }
  await authUserPer({
    req,
    authToken: true,
    per: TeamManagePermissionVal
  });

  await syncUserAndOrg();
  return {};
}
export default NextAPI(handler);
