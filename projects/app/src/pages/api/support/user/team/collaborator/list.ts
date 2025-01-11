import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { authUserPer } from '@fastgpt/service/support/permission/user/auth';
import { TeamReadPermissionVal } from '@fastgpt/global/support/permission/user/constant';
import { DEFAULT_ORG_AVATAR } from '@fastgpt/global/common/system/constants';
import { CollaboratorItemType } from '@fastgpt/global/support/permission/collaborator';
import { getClbsAndGroupsWithInfo } from '@fastgpt/service/support/permission/controller';
import { TeamPermission } from '@fastgpt/global/support/permission/user/controller';
import { TeamMemberRoleEnum } from '@fastgpt/global/support/user/team/constant';

export type TeamClbsListQuery = {};
export type TeamClbsListBody = {};

export type TeamClbsListResponse = CollaboratorItemType[];

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

  const [tmbs, groups, orgs] = await getClbsAndGroupsWithInfo({
    teamId,
    resourceType: 'team'
  });

  const clbsWithInfo = tmbs
    .map((item) => {
      return {
        tmbId: item.tmb._id,
        teamId: item.teamId,
        permission: new TeamPermission({
          per: item.permission,
          isOwner: item.tmb.role === TeamMemberRoleEnum.owner
        }),
        name: item.tmb.name,
        avatar: item.tmb.user.avatar
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const groupsWithInfo = groups.map((item) => {
    return {
      groupId: item.group._id,
      teamId: item.teamId,
      permission: new TeamPermission({ per: item.permission }),
      name: item.group.name,
      avatar: item.group.avatar
    };
  });

  const orgsWithInfo = orgs.map((item) => ({
    orgId: item.org._id,
    teamId: item.teamId,
    permission: new TeamPermission({ per: item.permission }),
    name: item.org.name,
    avatar: item.org.avatar || DEFAULT_ORG_AVATAR
  }));

  return [...clbsWithInfo, ...groupsWithInfo, ...orgsWithInfo];
}

export default NextAPI(handler);
