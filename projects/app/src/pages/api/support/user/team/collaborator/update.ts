import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { CommonErrEnum } from '@fastgpt/global/common/error/code/common';
import { authUserPer } from '@fastgpt/service/support/permission/user/auth';
import { PerResourceTypeEnum } from '@fastgpt/global/support/permission/constant';
import { TeamManagePermissionVal } from '@fastgpt/global/support/permission/user/constant';
import { MongoResourcePermission } from '@fastgpt/service/support/permission/schema';
import { TeamErrEnum } from '@fastgpt/global/common/error/code/team';
import { TeamDefaultPermissionVal } from '@fastgpt/global/support/permission/user/constant';
import { TeamPermission } from '@fastgpt/global/support/permission/user/controller';
import type { UpdateClbPermissionProps } from '@fastgpt/global/support/permission/collaborator';
import type { PermissionValueType } from '@fastgpt/global/support/permission/type';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import { addAuditLog } from '@fastgpt/service/support/user/audit/util';
import { AuditEventEnum } from '@fastgpt/global/support/user/audit/constants';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { MongoMemberGroupModel } from '@fastgpt/service/support/permission/memberGroup/memberGroupSchema';
import { MongoOrgModel } from '@fastgpt/service/support/permission/org/orgSchema';

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

  // Update permission
  // 至少要管理员才能改权限
  const {
    permission: userPer,
    teamId,
    isRoot,
    tmbId
  } = await authUserPer({
    req,
    authToken: true,
    per: TeamManagePermissionVal
  });

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

  if (permission === undefined) {
    const { teamId } = await authUserPer({
      req,
      authToken: true,
      per: TeamManagePermissionVal
    });

    return mongoSessionRun(async (session) => {
      const documentsToInsert = (() => {
        const docs: {
          teamId: string;
          resourceType: PerResourceTypeEnum;
          tmbId?: string;
          groupId?: string;
          orgId?: string;
        }[] = [];
        members.forEach((tmbId) => {
          docs.push({
            teamId,
            resourceType: PerResourceTypeEnum.team,
            tmbId
          });
        });
        groups.forEach((groupId) => {
          docs.push({
            teamId,
            resourceType: PerResourceTypeEnum.team,
            groupId
          });
        });
        orgs.forEach((orgId) => {
          docs.push({
            teamId,
            resourceType: PerResourceTypeEnum.team,
            orgId
          });
        });
        return docs;
      })();

      const existingDocuments = await MongoResourcePermission.find(
        {
          teamId,
          resourceType: PerResourceTypeEnum.team,
          resourceId: null
        },
        null,
        { session }
      );
      // 过滤出需要插入的文档
      const newDocuments = documentsToInsert
        .filter((v) => {
          return !existingDocuments.some(
            (d) =>
              (v.tmbId && String(v.tmbId) === String(d.tmbId)) ||
              (v.groupId && String(v.groupId) === String(d.groupId)) ||
              (v.orgId && String(v.orgId) === String(d.orgId))
          );
        })
        .map((doc) => ({
          ...doc,
          permission: TeamDefaultPermissionVal
        }));

      // 插入新文档
      if (newDocuments.length > 0) {
        await MongoResourcePermission.insertMany(newDocuments, {
          session
        });
      }
    });
  }

  // Auth
  const updatePer = new TeamPermission({ role: permission });
  await (async () => {
    if (isRoot || userPer.isOwner) return;

    const targets = await MongoResourcePermission.find(
      {
        resourceType: PerResourceTypeEnum.team,
        teamId,
        $or: [
          { tmbId: { $in: updateList.flatMap((v) => (v.tmbId ? [v.tmbId] : [])) } },
          { groupId: { $in: updateList.flatMap((v) => (v.groupId ? [v.groupId] : [])) } },
          { orgId: { $in: updateList.flatMap((v) => (v.orgId ? [v.orgId] : [])) } }
        ]
      },
      '_id permission'
    ).lean();

    const hasManagePer = targets.some((v) => {
      const Per = new TeamPermission({ role: v.permission });
      return Per.hasManagePer;
    });

    // 如果修改目标，包含管理员，则需要 owner
    // 如果需要更新成管理权限，则需要是owner
    if (hasManagePer !== updatePer.hasManagePer && !userPer.isOwner) {
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
        $set: { permission: updatePer.role }
      },
      upsert: true
    }
  }));

  (async () => {
    const targetNames = await Promise.all(
      updateList.map(async (v) => {
        if (v.tmbId) {
          const member = await MongoTeamMember.findOne({ _id: v.tmbId }, 'name').exec();
          return member?.name || v.tmbId;
        }
        if (v.groupId) {
          const group = await MongoMemberGroupModel.findOne({ _id: v.groupId }, 'name').exec();
          return group?.name || v.groupId;
        }
        if (v.orgId) {
          const org = await MongoOrgModel.findOne({ _id: v.orgId }, 'name').exec();
          return org?.name || v.orgId;
        }
        return '';
      })
    );

    addAuditLog({
      tmbId,
      teamId,
      event: AuditEventEnum.ASSIGN_PERMISSION,
      params: {
        objectName: targetNames.join(', '),
        permission: updatePer.role.toString() // TODO: remove toString()
      }
    });
  })();

  return mongoSessionRun(async (session) => {
    await MongoResourcePermission.bulkWrite(bulkOps, { session });
  });
}

export default NextAPI(handler);
