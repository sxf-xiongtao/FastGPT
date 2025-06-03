import { NextAPI } from '@/service/middleware/entry';
import { updateResourcePermission } from '@/service/support/permission/controller';
import { CommonErrEnum } from '@fastgpt/global/common/error/code/common';
import { DatasetErrEnum } from '@fastgpt/global/common/error/code/dataset';
import { UpdateDatasetCollaboratorBody } from '@fastgpt/global/core/dataset/collaborator';
import { DatasetTypeEnum } from '@fastgpt/global/core/dataset/constants';
import {
  ManagePermissionVal,
  PerResourceTypeEnum
} from '@fastgpt/global/support/permission/constant';
import { DatasetPermission } from '@fastgpt/global/support/permission/dataset/controller';
import { ResourcePermissionType } from '@fastgpt/global/support/permission/type';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import { MongoDataset } from '@fastgpt/service/core/dataset/schema';
import { getResourceClbsAndGroups } from '@fastgpt/service/support/permission/controller';
import { authDataset } from '@fastgpt/service/support/permission/dataset/auth';
import {
  syncChildrenPermission,
  UpdateCollaboratorItem
} from '@fastgpt/service/support/permission/inheritPermission';
import { getGroupsByTmbId } from '@fastgpt/service/support/permission/memberGroup/controllers';
import { getOrgsByTmbId } from '@fastgpt/service/support/permission/org/controllers';
import { MongoResourcePermission } from '@fastgpt/service/support/permission/schema';
import { addOperationLog } from '@fastgpt/service/support/operationLog/addOperationLog';
import { OperationLogEventEnum } from '@fastgpt/global/support/operationLog/constants';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { MongoMemberGroupModel } from '@fastgpt/service/support/permission/memberGroup/memberGroupSchema';
import { MongoOrgModel } from '@fastgpt/service/support/permission/org/orgSchema';
import { ApiRequestProps } from '@fastgpt/service/type/next';
import { getI18nDatasetType } from '@fastgpt/service/support/operationLog/util';

async function handler(req: ApiRequestProps<UpdateDatasetCollaboratorBody>) {
  // Authorization
  const {
    datasetId,
    members: tmbIds = [],
    groups: groupIds = [],
    orgs: orgIds = [],
    permission
  } = req.body;

  if (
    (tmbIds === undefined && groupIds === undefined && orgIds === undefined) ||
    permission === undefined
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
    // if (tmbIds.includes(tmbId)) {
    //   return Promise.reject(DatasetErrEnum.unAuthDataset);
    // }
    // can not update my group's permission unless I am owner
    const myGroupIds = (await getGroupsByTmbId({ tmbId, teamId })).map((item) => String(item._id));
    if (groupIds.some((groupId) => myGroupIds.includes(groupId)) && !myPer.isOwner) {
      return Promise.reject(DatasetErrEnum.unAuthDataset);
    }

    const myOrgIds = (await getOrgsByTmbId({ teamId, tmbId })).map((item) => String(item.orgId));
    if (orgIds?.some((orgId) => myOrgIds.includes(orgId)) && !myPer.isOwner) {
      return Promise.reject(DatasetErrEnum.unAuthDataset);
    }

    // can not update admin's permission unless I am owner
    if (new DatasetPermission({ per: permission }).hasManagePer && !myPer.isOwner) {
      return Promise.reject(DatasetErrEnum.unAuthDataset);
    }
  })();

  const isFolder = dataset.type === DatasetTypeEnum.folder;
  const checkAdminPerChanged = async (clbOrGroups: ResourcePermissionType[]) => {
    if (
      clbOrGroups.some((clb) => {
        const oldPer = new DatasetPermission({ per: clb.permission });
        const newPer = new DatasetPermission({ per: permission });
        const updatedClbAndGroups = [...tmbIds, ...groupIds, ...orgIds];
        if (
          (oldPer.hasManagePer !== newPer.hasManagePer && // manage permission changed
            (updatedClbAndGroups.includes(String(clb.tmbId)) || // clb is updated
              updatedClbAndGroups.includes(String(clb.groupId)))) ||
          updatedClbAndGroups.includes(String(clb.orgId)) // clb is updated
        ) {
          return true;
        }
      }) &&
      !myPer.isOwner
    ) {
      return Promise.reject(DatasetErrEnum.unAuthDataset);
    }
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

      await checkAdminPerChanged(FolderClbsAndGroups);

      const updateClbsAndGroups = <UpdateCollaboratorItem[]>[];

      updateClbsAndGroups.push(
        ...tmbIds?.map((tmbId) => ({
          tmbId,
          permission
        })),
        ...groupIds?.map((groupId) => ({
          groupId,
          permission
        })),
        ...orgIds?.map((orgId) => ({
          orgId,
          permission
        })),
        ...FolderClbsAndGroups.filter(
          (item) => !!item.tmbId && !tmbIds?.includes(String(item.tmbId))
        ).map((item) => ({
          tmbId: item.tmbId!,
          permission: tmbIds?.includes(String(item.tmbId)) ? permission : item.permission
        })),
        ...FolderClbsAndGroups.filter(
          (item) => !!item.groupId && !groupIds?.includes(String(item.groupId))
        ).map((item) => ({
          groupId: item.groupId!,
          permission: groupIds?.includes(String(item.groupId)) ? permission : item.permission
        })),
        ...FolderClbsAndGroups.filter(
          (item) => !!item.orgId && !orgIds?.includes(String(item.orgId))
        ).map((item) => ({
          orgId: item.orgId!,
          permission: orgIds?.includes(String(item.orgId)) ? permission : item.permission
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

        const updateClbsAndGroups: UpdateCollaboratorItem[] = [];

        updateClbsAndGroups.push(
          ...groupIds?.map((groupId) => ({
            teamId,
            resourceId: datasetId,
            resourceType: PerResourceTypeEnum.dataset,
            groupId,
            permission
          })),
          ...tmbIds?.map((tmbId) => ({
            teamId,
            resourceId: datasetId,
            resourceType: PerResourceTypeEnum.dataset,
            tmbId,
            permission
          })),
          ...orgIds?.map((orgId) => ({
            teamId,
            resourceId: datasetId,
            resourceType: PerResourceTypeEnum.dataset,
            orgId,
            permission
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
      permission
    });
  });

  (async () => {
    const teamMembers = await MongoTeamMember.find({ _id: { $in: tmbIds } }, 'name').lean();
    const memberNames = teamMembers.map((member) => member.name);

    const groups = await MongoMemberGroupModel.find({ _id: { $in: groupIds } }, 'name').lean();
    const groupNames = groups.map((group) => group.name);

    const orgs = await MongoOrgModel.find({ _id: { $in: orgIds } }, 'name').lean();
    const orgNames = orgs.map((org) => org.name);
    const datasetType = getI18nDatasetType(dataset.type);

    addOperationLog({
      tmbId,
      teamId,
      event: OperationLogEventEnum.UPDATE_DATASET_COLLABORATOR,
      params: {
        datasetName: dataset.name,
        datasetType: datasetType,
        tmbList: memberNames,
        groupList: groupNames,
        orgList: orgNames,
        permission: String(permission)
      }
    });
  })();
}

export default NextAPI(handler);
