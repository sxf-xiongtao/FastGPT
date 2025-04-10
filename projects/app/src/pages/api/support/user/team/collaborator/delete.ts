import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { authMember } from '@/service/support/permission/team/auth';
import {
  OwnerPermissionVal,
  PerResourceTypeEnum
} from '@fastgpt/global/support/permission/constant';
import { MongoResourcePermission } from '@fastgpt/service/support/permission/schema';
import { RequireOnlyOne } from '@fastgpt/global/common/type/utils';
import { authUserPer } from '@fastgpt/service/support/permission/user/auth';
import { TeamManagePermissionVal } from '@fastgpt/global/support/permission/user/constant';
import { TeamPermission } from '@fastgpt/global/support/permission/user/controller';
import { TeamErrEnum } from '@fastgpt/global/common/error/code/team';
import { CommonErrEnum } from '@fastgpt/global/common/error/code/common';

export type removeQuery = RequireOnlyOne<{
  tmbId?: string;
  groupId?: string;
  orgId?: string;
}>;
export type removeBody = {};
export type removeResponse = {};

async function handler(
  req: ApiRequestProps<removeBody, removeQuery>,
  _res: ApiResponseType<any>
): Promise<removeResponse> {
  const { tmbId, groupId, orgId } = req.query;

  if (!tmbId && !groupId && !orgId) {
    return Promise.reject(CommonErrEnum.missingParams);
  }

  // 至少要管理员才能改权限
  const {
    permission: userPer,
    teamId,
    isRoot
  } = await authUserPer({
    req,
    authToken: true,
    per: TeamManagePermissionVal
  });
  await (async () => {
    if (isRoot || userPer.isOwner) return;

    // 如果修改目标，包含管理员，则需要 owner
    const target = await MongoResourcePermission.findOne(
      {
        resourceType: PerResourceTypeEnum.team,
        teamId,
        resourceId: null,
        ...(tmbId ? { tmbId } : {}),
        ...(groupId ? { groupId } : {}),
        ...(orgId ? { orgId } : {})
      },
      '_id permission'
    ).lean();

    if (!target) return Promise.reject(TeamErrEnum.notUser);

    const hasManagePer = new TeamPermission({ per: target.permission }).hasManagePer;
    if (hasManagePer && !userPer.isOwner) {
      return Promise.reject(TeamErrEnum.unAuthTeam);
    }
  })();

  await MongoResourcePermission.deleteOne({
    resourceType: PerResourceTypeEnum.team,
    teamId,
    ...(tmbId ? { tmbId } : {}),
    ...(groupId ? { groupId } : {}),
    ...(orgId ? { orgId } : {})
  });

  return {};
}

export default NextAPI(handler);
