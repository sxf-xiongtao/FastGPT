import { TeamErrEnum } from '@fastgpt/global/common/error/code/team';
import { PermissionValueType } from '@fastgpt/global/support/permission/type';
import { checkPermission } from '@fastgpt/service/support/permission/resourcePermission/permisson';
import { getTeamMember } from './controller';

// auth member permission
// @param tmbId: the objectId of team member
// @param permission: the permission of the member [PermissionType]
export async function authMemberPermission({
  tmbId,
  permission
}: {
  tmbId: string;
  permission: PermissionValueType;
}) {
  const member = await getTeamMember(tmbId);

  if (checkPermission(member.permission, permission)) {
    return member;
  } else {
    return Promise.reject(TeamErrEnum.unAuthTeam);
  }
}
