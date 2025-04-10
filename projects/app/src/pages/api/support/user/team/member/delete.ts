import type { NextApiRequest, NextApiResponse } from 'next';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { getTeamMember } from '@/service/support/user/team/controller';
import { DelMemberProps } from '@fastgpt/global/support/user/team/controller';
import { authMemberPermission } from '@/service/support/permission/team/auth';
import { OwnerPermissionVal } from '@fastgpt/global/support/permission/constant';
import { NextAPI } from '@/service/middleware/entry';
import { removeUserFromTeam } from '@/service/support/user/controller';
import { TeamManagePermissionVal } from '@fastgpt/global/support/permission/user/constant';
import { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';

export type MemberDeleteQuery = DelMemberProps;
export type MemberDeleteBody = {};
export type MemberDeleteResponse = {};

async function handler(
  req: ApiRequestProps<MemberDeleteBody, MemberDeleteQuery>,
  res: ApiResponseType<any>
): Promise<MemberDeleteResponse> {
  const { tmbId: memberId } = req.query;
  const { teamId, tmbId } = await authCert({ req, authToken: true });

  // get member permission
  const member = await getTeamMember({
    teamId,
    tmbId: memberId
  });

  if (member.permission.hasManagePer) {
    await authMemberPermission({ teamId, tmbId, permission: OwnerPermissionVal });
  } else {
    await authMemberPermission({ teamId, tmbId, permission: TeamManagePermissionVal });
  }

  await removeUserFromTeam({
    teamId,
    memberId
  });

  return {};
}

export default NextAPI(handler);
