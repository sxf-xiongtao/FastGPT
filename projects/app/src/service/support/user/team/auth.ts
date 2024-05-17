import { TeamErrEnum } from '@fastgpt/global/common/error/code/team';
import { PermissionValueType } from '@fastgpt/global/support/permission/type';
import { checkPermission } from '@fastgpt/service/support/permission/resourcePermission/permisson';
import { MongoTeam } from '@fastgpt/service/support/user/team/teamSchema';
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

export async function authOwner({ userId, teamId }: { userId: string; teamId: string }) {
  const team = await MongoTeam.findById(teamId);
  if (!team || team.ownerId.toString() !== userId.toString()) {
    return Promise.reject(TeamErrEnum.unAuthTeam);
  } else {
    return team;
  }
}
