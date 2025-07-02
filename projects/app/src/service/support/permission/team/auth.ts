import { TeamErrEnum } from '@fastgpt/global/common/error/code/team';
import type { PermissionValueType } from '@fastgpt/global/support/permission/type';
import { getTeamMember } from '../../user/team/controller';
import { parseHeaderCert } from '@fastgpt/service/support/permission/controller';
import type { TeamMemberItemType } from '@fastgpt/global/support/user/team/type';
import type { AuthModeType, AuthResponseType } from '@fastgpt/service/support/permission/type';
import { OwnerPermissionVal } from '@fastgpt/global/support/permission/constant';

export const authMember = async ({
  per = OwnerPermissionVal,
  ...props
}: AuthModeType): Promise<
  AuthResponseType & {
    member: TeamMemberItemType;
  }
> => {
  const result = await parseHeaderCert(props);
  const { teamId, tmbId } = result;

  const member = await authMemberPermission({ teamId, tmbId, permission: per });

  return {
    ...result,
    member,
    permission: member.permission
  };
};
// auth member permission
// @param tmbId: the objectId of team member
// @param permission: the permission of the member [PermissionType]
export async function authMemberPermission({
  teamId,
  tmbId,
  permission
}: {
  teamId: string;
  tmbId: string;
  permission: PermissionValueType;
}) {
  const member = await getTeamMember({ teamId, tmbId });

  if (member.permission.checkPer(permission)) {
    return member;
  } else {
    return Promise.reject(TeamErrEnum.unAuthTeam);
  }
}
