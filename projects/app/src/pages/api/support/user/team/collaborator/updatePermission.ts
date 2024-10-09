import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { RequireOnlyOne } from '@fastgpt/global/common/type/utils';
import { CommonErrEnum } from '@fastgpt/global/common/error/code/common';
import { authUserPer } from '@fastgpt/service/support/permission/user/auth';
import { PerResourceTypeEnum } from '@fastgpt/global/support/permission/constant';
import { TeamManagePermissionVal } from '@fastgpt/global/support/permission/user/constant';
import { MongoResourcePermission } from '@fastgpt/service/support/permission/schema';
import { PermissionValueType } from '@fastgpt/global/support/permission/type';
import { TeamErrEnum } from '@fastgpt/global/common/error/code/team';
import { TeamDefaultPermissionVal } from '@fastgpt/global/support/permission/user/constant';
import { getTmbInfoByTmbId } from '@fastgpt/service/support/user/team/controller';
import { TeamPermission } from '@fastgpt/global/support/permission/user/controller';

export type UpdatePermissionQuery = {};
export type UpdatePermissionBody = {
  permission: PermissionValueType;
} & RequireOnlyOne<{
  memberId: string;
  groupId: string;
}>;

export type UpdatePermissionResponse = {};

async function handler(
  req: ApiRequestProps<UpdatePermissionBody, UpdatePermissionQuery>,
  _res: ApiResponseType<any>
): Promise<UpdatePermissionResponse> {
  const { permission, memberId, groupId } = req.body;

  if ((!memberId && !groupId) || permission === undefined) {
    return Promise.reject(CommonErrEnum.missingParams);
  }

  // Only Team manager could update collaborator's permission
  const { permission: userPer, teamId } = await authUserPer({
    req,
    authToken: true,
    per: TeamManagePermissionVal
  });

  const oldPer = await (async () => {
    const p = await MongoResourcePermission.findOne({
      teamId,
      groupId,
      tmbId: memberId,
      resourceType: PerResourceTypeEnum.team
    });

    const info = memberId ? await getTmbInfoByTmbId({ tmbId: memberId }) : undefined;
    return new TeamPermission({
      per: p?.permission ?? TeamDefaultPermissionVal,
      isOwner: info?.role === 'owner' ?? false
    });
  })();

  const newPer = new TeamPermission({
    per: permission
  });

  // team owner's permission is inmutable
  if (oldPer.isOwner) {
    return Promise.reject(TeamErrEnum.unAuthTeam);
  }

  // only owner could change the member/group's manage permission
  if (oldPer.hasManagePer !== newPer.hasManagePer) {
    if (!userPer.isOwner) {
      return Promise.reject(TeamErrEnum.unAuthTeam);
    }
  }

  // We need to remove the user whose permission is TeamDefaultPermissionVal(Read)
  // Thus, the user's permission fallback to Group Permission.
  if (newPer.value === TeamDefaultPermissionVal && memberId) {
    await MongoResourcePermission.deleteOne({
      teamId,
      resourceType: PerResourceTypeEnum.team,
      tmbId: memberId
    });
  } else {
    await MongoResourcePermission.updateOne(
      {
        teamId,
        resourceType: PerResourceTypeEnum.team,
        ...(memberId ? { tmbId: memberId } : { groupId })
      },
      {
        permission: newPer.value
      },
      { upsert: true }
    );
  }

  return {};
}

export default NextAPI(handler);
