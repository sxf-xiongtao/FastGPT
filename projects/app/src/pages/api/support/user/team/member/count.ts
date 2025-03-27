import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { authUserPer } from '@fastgpt/service/support/permission/user/auth';
import { TeamReadPermissionVal } from '@fastgpt/global/support/permission/user/constant';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { notLeaveStatus } from '@fastgpt/global/support/user/team/constant';

export type MemberCountQuery = {};
export type MemberCountBody = {};
export type MemberCountResponse = {};

async function handler(
  req: ApiRequestProps<MemberCountBody, MemberCountQuery>,
  res: ApiResponseType<any>
): Promise<MemberCountResponse> {
  const { teamId } = await authUserPer({
    req,
    authToken: true,
    per: TeamReadPermissionVal
  });

  const count = await MongoTeamMember.countDocuments({
    teamId,
    status: notLeaveStatus
  });

  return {
    count
  };
}
export default NextAPI(handler);
