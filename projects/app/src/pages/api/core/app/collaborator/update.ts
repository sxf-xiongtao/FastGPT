import { NextAPI } from '@/service/middleware/entry';
import type { NextApiRequest } from 'next';

import { updateResourcePermission } from '@/service/support/permission/controller';
import { AppErrEnum } from '@fastgpt/global/common/error/code/app';
import { CommonErrEnum } from '@fastgpt/global/common/error/code/common';
import type { UpdateAppCollaboratorBody } from '@fastgpt/global/core/app/collaborator';
import { AppFolderTypeList } from '@fastgpt/global/core/app/constants';
import { AppPermission } from '@fastgpt/global/support/permission/app/controller';
import {
  ManagePermissionVal,
  PerResourceTypeEnum
} from '@fastgpt/global/support/permission/constant';
import type { ResourcePermissionType } from '@fastgpt/global/support/permission/type';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import { MongoApp } from '@fastgpt/service/core/app/schema';
import { authApp } from '@fastgpt/service/support/permission/app/auth';
import { getResourceClbsAndGroups } from '@fastgpt/service/support/permission/controller';
import {
  type UpdateCollaboratorItem,
  syncChildrenPermission
} from '@fastgpt/service/support/permission/inheritPermission';
import { getGroupsByTmbId } from '@fastgpt/service/support/permission/memberGroup/controllers';
import { getOrgsByTmbId } from '@fastgpt/service/support/permission/org/controllers';
import { MongoResourcePermission } from '@fastgpt/service/support/permission/schema';
import { addOperationLog } from '@fastgpt/service/support/operationLog/addOperationLog';
import { OperationLogEventEnum } from '@fastgpt/global/support/operationLog/constants';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { MongoMemberGroupModel } from '@fastgpt/service/support/permission/memberGroup/memberGroupSchema';
import { MongoOrgModel } from '@fastgpt/service/support/permission/org/orgSchema';
import { getI18nAppType } from '@fastgpt/service/support/operationLog/util';
import { AppDetailType } from '@fastgpt/global/core/app/type';
/*
  增加或修改协作者
  1. 继承态目录：关闭继承态，更新新的协作者，同步其子目录协作者
  2. 继承态应用：关闭继承态，复制父级协作者，并更新新的协作者
  3. 非继承态目录：更新新的协作者，同步其子目录协作者
  4. 非继承态应用：更新新的协作者
*/
async function handler(req: NextApiRequest) {
  // Authorization
  const {
    appId,
    permission,
    members: tmbIds = [],
    groups: groupIds = [],
    orgs: orgIds = []
  } = req.body as UpdateAppCollaboratorBody;

  // check params
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
    app,
    isRoot
  } = await authApp({
    req,
    authToken: true,
    appId,
    per: ManagePermissionVal
  });

  await (async () => {
    if (isRoot) return;

    // can not update own permission
    // if (tmbIds?.includes(tmbId)) {
    //   return Promise.reject(AppErrEnum.unAuthApp);
    // }
    // can not update my group's permission unless I am owner
    const myGroupIds = (await getGroupsByTmbId({ tmbId, teamId })).map((item) => String(item._id));
    if (groupIds?.some((groupId) => myGroupIds.includes(groupId)) && !myPer.isOwner) {
      return Promise.reject(AppErrEnum.unAuthApp);
    }

    const myOrgIds = (await getOrgsByTmbId({ teamId, tmbId })).map((item) => String(item.orgId));
    if (orgIds?.some((orgId) => myOrgIds.includes(orgId)) && !myPer.isOwner) {
      return Promise.reject(AppErrEnum.unAuthApp);
    }

    // can not update admin's permission unless I am owner
    if (new AppPermission({ per: permission }).hasManagePer && !myPer.isOwner) {
      return Promise.reject(AppErrEnum.unAuthApp);
    }
  })();

  const isFolder = AppFolderTypeList.includes(app.type);
  const checkAdminPerChanged = async (clbOrGroups: ResourcePermissionType[]) => {
    if (
      clbOrGroups.some((clb) => {
        const oldPer = new AppPermission({ per: clb.permission });
        const newPer = new AppPermission({ per: permission });
        const updatedClbAndGroups = [...tmbIds, ...groupIds, orgIds];
        if (
          oldPer.hasManagePer !== newPer.hasManagePer && // manage permission changed
          (updatedClbAndGroups.includes(String(clb.tmbId)) || // clb is updated
            updatedClbAndGroups.includes(String(clb.groupId)) ||
            updatedClbAndGroups.includes(String(clb.orgId))) // clb is updated
        ) {
          return true;
        }
      }) &&
      !myPer.isOwner
    ) {
      return Promise.reject(AppErrEnum.unAuthApp);
    }
  };

  await mongoSessionRun(async (session) => {
    // 关闭继承态
    if (app.inheritPermission && app.parentId) {
      await MongoApp.updateOne(
        { _id: appId },
        {
          inheritPermission: false
        },
        {
          session
        }
      );
    }

    // 拼接更新后完整的协作者/ Group 列表
    if (isFolder) {
      // 获取当前目录的协作者，并与需要变更的协作者合并
      const FolderClbsAndGroups = await getResourceClbsAndGroups({
        resourceId: appId,
        teamId,
        resourceType: PerResourceTypeEnum.app,
        session
      });
      await checkAdminPerChanged(FolderClbsAndGroups);
      // only owner could change manager's permission
      const updateClbsAndGroups: UpdateCollaboratorItem[] = [];

      updateClbsAndGroups.push(
        ...tmbIds.map((tmbId) => ({
          tmbId,
          permission
        })),
        ...groupIds.map((groupId) => ({
          groupId,
          permission
        })),
        ...orgIds.map((orgId) => ({
          orgId,
          permission
        })),
        ...FolderClbsAndGroups.filter(
          (item) => !!item.tmbId && !tmbIds.includes(String(item.tmbId))
        ).map((item) => ({
          tmbId: item.tmbId!,
          permission: tmbIds.includes(String(item.tmbId)) ? permission : item.permission
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
        resource: app,
        resourceModel: MongoApp,
        folderTypeList: AppFolderTypeList,
        resourceType: PerResourceTypeEnum.app,
        collaborators: updateClbsAndGroups,
        session
      });
    } else {
      // is not folder
      if (app.inheritPermission && app.parentId) {
        // 获取父级的协作者， 并与需要变更的协作者合并
        const parentClbsAndGroups = await getResourceClbsAndGroups({
          teamId: app.teamId,
          resourceId: app.parentId,
          resourceType: PerResourceTypeEnum.app,
          session
        });

        await checkAdminPerChanged(parentClbsAndGroups);

        // 找到在变更 member 列表中的协作者，单独更新
        const updateClbsAndGroups: UpdateCollaboratorItem[] = [];
        updateClbsAndGroups.push(
          ...tmbIds.map((tmbId) => ({
            teamId,
            resourceId: appId,
            resourceType: PerResourceTypeEnum.app,
            tmbId,
            permission
          })),
          ...groupIds.map((groupId) => ({
            teamId,
            resourceId: appId,
            resourceType: PerResourceTypeEnum.app,
            groupId,
            permission
          })),
          ...orgIds.map((orgId) => ({
            teamId,
            resourceId: appId,
            resourceType: PerResourceTypeEnum.app,
            orgId,
            permission
          }))
        );

        const unchangedClbsAndGroups = parentClbsAndGroups.filter(
          (item) =>
            (!!item.tmbId && !tmbIds.includes(String(item.tmbId))) || // parent's tmbIds
            (!!item.groupId && !groupIds.includes(String(item.groupId))) || // parent's groupIds
            (!!item.orgId && !orgIds.includes(String(item.orgId))) // parent's orgIds
        );

        // 先创建未变更的协作者（内容不变）
        await MongoResourcePermission.create(
          unchangedClbsAndGroups.map((item) => ({
            teamId,
            resourceId: appId,
            resourceType: PerResourceTypeEnum.app,
            ...(item.tmbId && {
              tmbId: item.tmbId
            }),
            ...(item.groupId && {
              groupId: item.groupId
            }),
            ...(item.orgId && {
              orgId: item.orgId
            }),
            permission: item.permission
          })),
          { session, ordered: true }
        );
      }
    }

    // 只根据传入的 tmbIds 和 groupIds 更新协作者，只更新当前应用
    await updateResourcePermission({
      resourceType: PerResourceTypeEnum.app,
      resourceId: appId,
      session,
      teamId,
      tmbIdList: tmbIds,
      groupIdList: groupIds,
      orgIdList: orgIds,
      permission
    });
  });

  auditLog({
    tmbId,
    teamId,
    tmbIds,
    groupIds,
    orgIds,
    app,
    permission
  });
}

export default NextAPI(handler);

const auditLog = async ({
  tmbId,
  teamId,
  tmbIds,
  groupIds,
  orgIds,
  app,
  permission
}: {
  tmbId: string;
  teamId: string;
  tmbIds: string[];
  groupIds: string[];
  orgIds: string[];
  app: AppDetailType;
  permission: number;
}) => {
  try {
    const appType = getI18nAppType(app.type);

    const tmbNames = await Promise.all(
      tmbIds.map(async (tmbId) => {
        const member = await MongoTeamMember.findOne({ _id: tmbId }, 'name').exec();
        return member?.name || tmbId;
      })
    );

    const groupNames = await Promise.all(
      groupIds.map(async (groupId) => {
        const group = await MongoMemberGroupModel.findOne({ _id: groupId }, 'name').exec();
        return group?.name || groupId;
      })
    );

    const orgNames = await Promise.all(
      orgIds.map(async (orgId) => {
        const org = await MongoOrgModel.findOne({ _id: orgId }, 'name').exec();
        return org?.name || orgId;
      })
    );

    addOperationLog({
      tmbId,
      teamId,
      event: OperationLogEventEnum.UPDATE_APP_COLLABORATOR,
      params: {
        appName: app.name,
        appType: appType,
        tmbList: tmbNames,
        groupList: groupNames,
        orgList: orgNames,
        permission: String(permission)
      }
    });
  } catch (error) {
    console.log('Add audit error: app collaborator', error);
  }
};
