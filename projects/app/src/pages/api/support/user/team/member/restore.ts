import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { authUserPer } from '@fastgpt/service/support/permission/user/auth';
import { TeamManagePermissionVal } from '@fastgpt/global/support/permission/user/constant';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { TeamMemberStatusEnum } from '@fastgpt/global/support/user/team/constant';
import { TeamModeEnum } from '@/global/settings/constants';
export type MemberRestoreQuery = {};
export type MemberRestoreBody = {
  tmbId: string;
};
export type MemberRestoreResponse = {};
async function handler(
  req: ApiRequestProps<MemberRestoreBody, MemberRestoreQuery>,
  res: ApiResponseType<any>
): Promise<MemberRestoreResponse> {
  const { tmbId } = req.body;

  const { teamId } = await authUserPer({
    req,
    authToken: true,
    per: TeamManagePermissionVal
  });

  if (global.systemConfig.teamMode !== TeamModeEnum.sync) {
    return Promise.reject('Only when Sync User feature is enabled can be restored');
  }

  await MongoTeamMember.updateOne(
    { _id: tmbId, teamId, status: TeamMemberStatusEnum.forbidden },
    {
      status: TeamMemberStatusEnum.active
    }
  );

  return {};
}
export default NextAPI(handler);
