import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { authUserPer } from '@fastgpt/service/support/permission/user/auth';
import { PerResourceTypeEnum } from '@fastgpt/global/support/permission/constant';
import { getResourceAllClbs } from '@fastgpt/service/support/permission/controller';
import { TeamReadPermissionVal } from '@fastgpt/global/support/permission/user/constant';

export type TeamClbsListQuery = {};
export type TeamClbsListBody = {};
export type TeamClbsListResponse = {};

/** Get team collaborators */
async function handler(
  req: ApiRequestProps<TeamClbsListBody, TeamClbsListQuery>,
  _res: ApiResponseType<any>
): Promise<TeamClbsListResponse> {
  const { teamId } = await authUserPer({
    req,
    authToken: true,
    per: TeamReadPermissionVal
  });

  const clbs = await getResourceAllClbs({
    resourceType: PerResourceTypeEnum.team,
    teamId
  });
  return clbs;
}
export default NextAPI(handler);
