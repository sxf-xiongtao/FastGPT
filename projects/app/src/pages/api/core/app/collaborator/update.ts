import type { NextApiRequest } from 'next';
import { NextAPI } from '@/service/middleware/entry';

import { authApp } from '@fastgpt/service/support/permission/app/auth';
import {
  PerResourceTypeEnum,
  ManagePermissionVal
} from '@fastgpt/global/support/permission/constant';
import { UpdateAppCollaboratorBody } from '@fastgpt/global/core/app/collaborator';
import { AppPermission } from '@fastgpt/global/support/permission/app/controller';
import { AppFolderTypeList } from '@fastgpt/global/core/app/constants';
import {
  syncChildrenPermission,
  UpdateCollaboratorItem
} from '@fastgpt/service/support/permission/inheritPermission';
import { getResourceClbsAndGroups } from '@fastgpt/service/support/permission/controller';
import { MongoApp } from '@fastgpt/service/core/app/schema';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import { updateResourcePermission } from '@/service/support/permission/controller';
import { MongoResourcePermission } from '@fastgpt/service/support/permission/schema';
import { CommonErrEnum } from '@fastgpt/global/common/error/code/common';
import { AppErrEnum } from '@fastgpt/global/common/error/code/app';
import { getGroupsByTmbId } from '@fastgpt/service/support/permission/memberGroup/controllers';
import { ResourcePermissionType } from '@fastgpt/global/support/permission/type';

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
    groups: groupIds = []
  } = req.body as UpdateAppCollaboratorBody;

  // check params
  if (tmbIds === undefined && groupIds === undefined) {
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
    if (tmbIds?.includes(tmbId)) {
      return Promise.reject(AppErrEnum.unAuthApp);
    }
    // can not update my group's permission unless I am owner
    const myGroupIds = (await getGroupsByTmbId({ tmbId, teamId })).map((item) => String(item._id));
    if (groupIds?.some((groupId) => myGroupIds.includes(groupId)) && !myPer.isOwner) {
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
        const updatedClbAndGroups = [...tmbIds, ...groupIds];
        if (
          oldPer.hasManagePer !== newPer.hasManagePer && // manage permission changed
          (updatedClbAndGroups.includes(String(clb.tmbId)) || // clb is updated
            updatedClbAndGroups.includes(String(clb.groupId))) // clb is updated
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
          ...groupIds?.map((groupId) => ({
            teamId,
            resourceId: appId,
            resourceType: PerResourceTypeEnum.app,
            groupId,
            permission
          }))
        );

        const unchangedClbsAndGroups = parentClbsAndGroups.filter(
          (item) =>
            (!!item.tmbId && !tmbIds.includes(String(item.tmbId))) || // parent's tmbIds
            (!!item.groupId && !groupIds.includes(String(item.groupId))) // parent's groupIds
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
            permission: item.permission
          })),
          { session }
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
      permission
    });
  });
}

export default NextAPI(handler);
