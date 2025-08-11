import { NextAPI } from '@/service/middleware/entry';
import { updateResourcePermission } from '@/service/support/permission/controller';
import { CommonErrEnum } from '@fastgpt/global/common/error/code/common';
import { DatasetErrEnum } from '@fastgpt/global/common/error/code/dataset';
import type { UpdateDatasetCollaboratorBody } from '@fastgpt/global/core/dataset/collaborator';
import { DatasetTypeEnum } from '@fastgpt/global/core/dataset/constants';
import {
  ManagePermissionVal,
  PerResourceTypeEnum
} from '@fastgpt/global/support/permission/constant';
import { DatasetPermission } from '@fastgpt/global/support/permission/dataset/controller';
import type { ResourcePermissionType } from '@fastgpt/global/support/permission/type';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import { MongoDataset } from '@fastgpt/service/core/dataset/schema';
import { getResourceClbsAndGroups } from '@fastgpt/service/support/permission/controller';
import { authDataset } from '@fastgpt/service/support/permission/dataset/auth';
import type { UpdateCollaboratorItem } from '@fastgpt/service/support/permission/inheritPermission';
import { syncChildrenPermission } from '@fastgpt/service/support/permission/inheritPermission';
import { getGroupsByTmbId } from '@fastgpt/service/support/permission/memberGroup/controllers';
import { getOrgsByTmbId } from '@fastgpt/service/support/permission/org/controllers';
import { MongoResourcePermission } from '@fastgpt/service/support/permission/schema';
import { addAuditLog } from '@fastgpt/service/support/user/audit/util';
import { AuditEventEnum } from '@fastgpt/global/support/user/audit/constants';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { MongoMemberGroupModel } from '@fastgpt/service/support/permission/memberGroup/memberGroupSchema';
import { MongoOrgModel } from '@fastgpt/service/support/permission/org/orgSchema';
import type { ApiRequestProps } from '@fastgpt/service/type/next';
import { getI18nDatasetType } from '@fastgpt/service/support/user/audit/util';

async function handler(req: ApiRequestProps<UpdateDatasetCollaboratorBody>) {
  // Authorization
  const {
    datasetId,
    members: tmbIds = [],
    groups: groupIds = [],
    orgs: orgIds = [],
    permission: role
  } = req.body;

  if (
    (tmbIds === undefined && groupIds === undefined && orgIds === undefined) ||
    role === undefined
  ) {
    return Promise.reject(CommonErrEnum.missingParams);
  }

  const {
    teamId,
    tmbId,
    permission: myPer,
    dataset,
    isRoot
  } = await authDataset({
    req,
    authToken: true,
    datasetId,
    per: ManagePermissionVal
  });

  await (async () => {
    if (isRoot) return;

    // can not update own permission
    if (tmbIds.includes(tmbId)) {
      return Promise.reject(DatasetErrEnum.canNotEditAdminPermission);
    }
    // can not update my group's permission unless I am owner
    const [myGroupIds, myOrgIds] = await Promise.all([
      getGroupsByTmbId({ tmbId, teamId }).then((groups) => groups.map((item) => String(item._id))),
      getOrgsByTmbId({ tmbId, teamId }).then((orgs) => orgs.map((item) => String(item.orgId)))
    ]);

    if (
      (groupIds.some((groupId) => myGroupIds.includes(groupId)) ||
        orgIds?.some((orgId) => myOrgIds.includes(orgId))) &&
      !myPer.isOwner
    ) {
      return Promise.reject(DatasetErrEnum.unAuthDataset);
    }

    // can not update admin's permission unless I am owner
    if (new DatasetPermission({ role: role }).hasManagePer && !myPer.isOwner) {
      return Promise.reject(DatasetErrEnum.unAuthDataset);
    }
  })();

  const isFolder = dataset.type === DatasetTypeEnum.folder;
  const checkAdminPerChanged = (clbs: ResourcePermissionType[]) => {
    if (
      clbs.some((clb) => {
        const oldPer = new DatasetPermission({ role: clb.permission });
        const newPer = new DatasetPermission({ role: role });
        const updatedClbAndGroups = [...tmbIds, ...groupIds, ...orgIds];
        if (
          (oldPer.hasManagePer !== newPer.hasManagePer && // manage permission changed
            (updatedClbAndGroups.includes(String(clb.tmbId)) || // clb is updated
              updatedClbAndGroups.includes(String(clb.groupId)))) ||
          updatedClbAndGroups.includes(String(clb.orgId)) // clb is updated
        ) {
          return true;
        }
      })
    ) {
      if (myPer.isOwner) return true;
      return false;
    }
    return true;
  };

  await mongoSessionRun(async (session) => {
    // 关闭继承态
    if (dataset.inheritPermission && dataset.parentId) {
      await MongoDataset.updateOne(
        { _id: datasetId },
        {
          inheritPermission: false
        },
        {
          session
        }
      );
    }

    if (isFolder) {
      // 获取当前目录的协作者，并与需要变更的协作者合并
      const FolderClbsAndGroups = await getResourceClbsAndGroups({
        resourceId: datasetId,
        teamId,
        resourceType: PerResourceTypeEnum.dataset,
        session
      });

      if (!checkAdminPerChanged(FolderClbsAndGroups))
        return Promise.reject(DatasetErrEnum.canNotEditAdminPermission);

      const updateClbsAndGroups = <UpdateCollaboratorItem[]>[];

      updateClbsAndGroups.push(
        ...tmbIds?.map((tmbId) => ({
          tmbId,
          permission: role
        })),
        ...groupIds?.map((groupId) => ({
          groupId,
          permission: role
        })),
        ...orgIds?.map((orgId) => ({
          orgId,
          permission: role
        })),
        ...FolderClbsAndGroups.filter(
          (item) => !!item.tmbId && !tmbIds?.includes(String(item.tmbId))
        ).map((item) => ({
          tmbId: item.tmbId!,
          permission: tmbIds?.includes(String(item.tmbId)) ? role : item.permission
        })),
        ...FolderClbsAndGroups.filter(
          (item) => !!item.groupId && !groupIds?.includes(String(item.groupId))
        ).map((item) => ({
          groupId: item.groupId!,
          permission: groupIds?.includes(String(item.groupId)) ? role : item.permission
        })),
        ...FolderClbsAndGroups.filter(
          (item) => !!item.orgId && !orgIds?.includes(String(item.orgId))
        ).map((item) => ({
          orgId: item.orgId!,
          permission: orgIds?.includes(String(item.orgId)) ? role : item.permission
        }))
      );

      await syncChildrenPermission({
        resource: dataset,
        resourceModel: MongoDataset,
        folderTypeList: [DatasetTypeEnum.folder],
        resourceType: PerResourceTypeEnum.dataset,
        collaborators: updateClbsAndGroups,
        session
      });
    } else {
      if (dataset.inheritPermission && dataset.parentId) {
        // 获取父级的协作者， 并与需要变更的协作者合并
        const parentClbsAndGroups = await getResourceClbsAndGroups({
          teamId: dataset.teamId,
          resourceId: dataset.parentId,
          resourceType: PerResourceTypeEnum.dataset,
          session
        });

        if (!checkAdminPerChanged(parentClbsAndGroups))
          return Promise.reject(DatasetErrEnum.canNotEditAdminPermission);

        const updateClbsAndGroups: UpdateCollaboratorItem[] = [];

        updateClbsAndGroups.push(
          ...groupIds?.map((groupId) => ({
            teamId,
            resourceId: datasetId,
            resourceType: PerResourceTypeEnum.dataset,
            groupId,
            permission: role
          })),
          ...tmbIds?.map((tmbId) => ({
            teamId,
            resourceId: datasetId,
            resourceType: PerResourceTypeEnum.dataset,
            tmbId,
            permission: role
          })),
          ...orgIds?.map((orgId) => ({
            teamId,
            resourceId: datasetId,
            resourceType: PerResourceTypeEnum.dataset,
            orgId,
            permission: role
          }))
        );

        const unchangedClbsAndGroups = parentClbsAndGroups.filter(
          (item) =>
            (!!item.tmbId && !tmbIds?.includes(String(item.tmbId))) || // parent's tmbIds
            (!!item.groupId && !groupIds?.includes(String(item.groupId))) || // parent's groupIds
            (!!item.orgId && !orgIds?.includes(String(item.orgId))) // parent's orgIds
        );

        await MongoResourcePermission.create(
          unchangedClbsAndGroups.map((item) => ({
            teamId,
            resourceId: datasetId,
            resourceType: PerResourceTypeEnum.dataset,
            ...(item.tmbId && { tmbId: item.tmbId }),
            ...(item.groupId && { groupId: item.groupId }),
            ...(item.orgId && { orgId: item.orgId }),
            permission: item.permission
          })),
          { session, ordered: true }
        );
      } else {
        const oldClbs = await getResourceClbsAndGroups({
          resourceId: datasetId,
          teamId,
          resourceType: PerResourceTypeEnum.dataset,
          session
        });

        if (!checkAdminPerChanged(oldClbs))
          return Promise.reject(DatasetErrEnum.canNotEditAdminPermission);
      }
    }
    // 更新的协作者
    await updateResourcePermission({
      resourceType: PerResourceTypeEnum.dataset,
      resourceId: datasetId,
      session,
      teamId,
      tmbIdList: tmbIds,
      groupIdList: groupIds,
      orgIdList: orgIds,
      permission: role
    });
  });

  auditLog({
    teamId,
    tmbId,
    tmbIds,
    groupIds,
    orgIds,
    dataset,
    permission: role
  });
}

export default NextAPI(handler);

const auditLog = async ({
  tmbId,
  teamId,
  tmbIds,
  groupIds,
  orgIds,
  dataset,
  permission
}: {
  tmbId: string;
  teamId: string;
  tmbIds: string[];
  groupIds: string[];
  orgIds: string[];
  dataset: {
    name: string;
    type: string;
  };
  permission: number;
}) => {
  try {
    // Get team member names
    const teamMembers = await MongoTeamMember.find({ _id: { $in: tmbIds } }, 'name').lean();
    const memberNames = teamMembers.map((member) => member.name);

    // Get group names
    const groups = await MongoMemberGroupModel.find({ _id: { $in: groupIds } }, 'name').lean();
    const groupNames = groups.map((group) => group.name);

    // Get organization names
    const orgs = await MongoOrgModel.find({ _id: { $in: orgIds } }, 'name').lean();
    const orgNames = orgs.map((org) => org.name);

    // Get localized dataset type
    const datasetType = getI18nDatasetType(dataset.type);

    // Add operation log
    addAuditLog({
      tmbId,
      teamId,
      event: AuditEventEnum.UPDATE_DATASET_COLLABORATOR,
      params: {
        datasetName: dataset.name,
        datasetType: datasetType,
        tmbList: memberNames,
        groupList: groupNames,
        orgList: orgNames,
        permission: String(permission)
      }
    });
  } catch (error) {
    console.log('Add audit error: dataset collaborator', error);
  }
};
