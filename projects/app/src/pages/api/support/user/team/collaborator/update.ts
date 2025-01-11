import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { CommonErrEnum } from '@fastgpt/global/common/error/code/common';
import { authUserPer } from '@fastgpt/service/support/permission/user/auth';
import { PerResourceTypeEnum } from '@fastgpt/global/support/permission/constant';
import { TeamManagePermissionVal } from '@fastgpt/global/support/permission/user/constant';
import { MongoResourcePermission } from '@fastgpt/service/support/permission/schema';
import { TeamErrEnum } from '@fastgpt/global/common/error/code/team';
import { TeamDefaultPermissionVal } from '@fastgpt/global/support/permission/user/constant';
import { getTmbInfoByTmbId } from '@fastgpt/service/support/user/team/controller';
import { TeamPermission } from '@fastgpt/global/support/permission/user/controller';
import { UpdateClbPermissionProps } from '@fastgpt/global/support/permission/collaborator';
import { PermissionValueType } from '@fastgpt/global/support/permission/type';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';

export type UpdatePermissionQuery = {};
export type UpdatePermissionBody = Omit<UpdateClbPermissionProps, 'permission'> & {
  permission?: PermissionValueType;
};
export type UpdatePermissionResponse = any;

async function handler(
  req: ApiRequestProps<UpdatePermissionBody, UpdatePermissionQuery>,
  _res: ApiResponseType<any>
): Promise<UpdatePermissionResponse> {
  const { permission, members = [], groups = [], orgs = [] } = req.body;

  if (!members.length && !groups.length && !orgs.length) {
    return Promise.reject(CommonErrEnum.missingParams);
  }

  // 构建更新列表
  const updateList: { tmbId?: string; groupId?: string; orgId?: string }[] = [];
  members.forEach((v) => {
    updateList.push({
      tmbId: v
    });
  });
  groups.forEach((v) => {
    updateList.push({
      groupId: v
    });
  });
  orgs.forEach((v) => {
    updateList.push({
      orgId: v
    });
  });

  // Add member, zero permission
  if (permission === undefined) {
    const { teamId } = await authUserPer({
      req,
      authToken: true,
      per: TeamManagePermissionVal
    });

    const bulkOps = updateList.map((v) => ({
      updateOne: {
        filter: {
          teamId,
          resourceType: PerResourceTypeEnum.team,
          ...v
        },
        update: {
          $set: { permission: TeamDefaultPermissionVal }
        },
        upsert: true
      }
    }));

    return mongoSessionRun(async (session) => {
      await MongoResourcePermission.bulkWrite(bulkOps, { session });
    });
  }

  // Update permission
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

  // Auth
  const updatePer = new TeamPermission({ per: permission });
  await (async () => {
    if (isRoot || userPer.isOwner) return;

    // 如果需要更新成管理权限，则需要是owner
    if (updatePer.hasManagePer && !userPer.isOwner) {
      return Promise.reject(TeamErrEnum.unAuthTeam);
    }

    // 如果修改目标，包含管理员，则需要 owner
    const targets = await MongoResourcePermission.find(
      {
        resourceType: PerResourceTypeEnum.team,
        teamId,
        $or: [
          { tmbId: { $in: updateList.map((v) => v.tmbId) } },
          { groupId: { $in: updateList.map((v) => v.groupId) } },
          { orgId: { $in: updateList.map((v) => v.orgId) } }
        ]
      },
      '_id permission'
    ).lean();
    const hasManagePer = targets.some((v) => {
      const Per = new TeamPermission({ per: v.permission });
      return Per.hasManagePer;
    });
    if (hasManagePer && !userPer.isOwner) {
      return Promise.reject(TeamErrEnum.unAuthTeam);
    }
  })();

  // 更新权限
  const bulkOps = updateList.map((v) => ({
    updateOne: {
      filter: {
        teamId,
        resourceType: PerResourceTypeEnum.team,
        ...v
      },
      update: {
        $set: { permission: updatePer.value }
      },
      upsert: true
    }
  }));

  return mongoSessionRun(async (session) => {
    await MongoResourcePermission.bulkWrite(bulkOps, { session });
  });
}

export default NextAPI(handler);
