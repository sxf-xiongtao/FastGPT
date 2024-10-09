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
  type UpdateCollaboratorItem
} from '@fastgpt/service/support/permission/inheritPermission';
import { getResourceAllClbs } from '@fastgpt/service/support/permission/controller';
import { MongoApp } from '@fastgpt/service/core/app/schema';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import { updateResourcePermission } from '@/service/support/permission/controller';
import { MongoResourcePermission } from '@fastgpt/service/support/permission/schema';

/* 
  增加或修改协作者
  1. 继承态目录：关闭继承态，更新新的协作者，同步其子目录协作者
  2. 继承态应用：关闭继承态，复制父级协作者，并更新新的协作者
  3. 非继承态目录：更新新的协作者，同步其子目录协作者
  4. 非继承态应用：更新新的协作者
*/

async function handler(req: NextApiRequest) {
  // Authorization
  const { appId, permission, members: tmbIds = [] } = req.body as UpdateAppCollaboratorBody; // TODO: Temporary

  const {
    teamId,
    tmbId,
    permission: myPer,
    app
  } = await authApp({
    req,
    authToken: true,
    appId,
    per: ManagePermissionVal
  });

  if (tmbIds.includes(tmbId)) {
    return Promise.reject('Can not update your own permission');
  }

  if (new AppPermission({ per: permission }).hasManagePer && !myPer.isOwner) {
    return Promise.reject('Only owner could grant manage permission');
  }

  const isFolder = AppFolderTypeList.includes(app.type);

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

    const { updateClbs, updateTmbIds } = await (async () => {
      if (isFolder) {
        // 获取当前目录的协作者，并与需要变更的协作者合并
        const FolderClbs = await getResourceAllClbs({
          resourceId: appId,
          teamId,
          resourceType: PerResourceTypeEnum.app,
          session
        });
        const updateClbs = tmbIds
          .map<UpdateCollaboratorItem>((tmbId) => ({
            tmbId,
            permission
          }))
          .concat(
            FolderClbs.filter((item) => !!item.tmbId && !tmbIds.includes(String(item.tmbId))).map(
              (item) => ({
                tmbId: item.tmbId!,
                permission: tmbIds.includes(String(item.tmbId)) ? permission : item.permission
              })
            )
          );

        return {
          updateClbs,
          updateTmbIds: tmbIds
        };
      } else {
        if (app.inheritPermission && app.parentId) {
          // 获取父级的协作者， 并与需要变更的协作者合并
          const parentClbs = await getResourceAllClbs({
            teamId: app.teamId,
            resourceId: app.parentId,
            resourceType: PerResourceTypeEnum.app,
            session
          });

          // 找到在变更 member 列表中的协作者，单独更新
          const updateClbs = parentClbs
            .filter((item) => tmbIds.includes(String(item.tmbId)))
            .map((item) => ({
              ...item,
              permission
            }));

          const unchangedClbs = parentClbs.filter((item) => !tmbIds.includes(String(item.tmbId)));

          // 先创建未变更的协作者（内容不变）
          await MongoResourcePermission.create(
            unchangedClbs.map((item) => ({
              teamId,
              resourceId: appId,
              resourceType: PerResourceTypeEnum.app,
              tmbId: item.tmbId,
              permission: item.permission
            })),
            { session }
          );

          return {
            updateClbs,
            updateTmbIds: updateClbs.filter((item) => !!item.tmbId).map((item) => item.tmbId!) // 继承态 app 是没有协作者的，这里需要全量复制
          };
        }

        return {
          updateClbs: [],
          updateTmbIds: tmbIds
        };
      }
    })();

    // 更新的协作者
    await updateResourcePermission({
      resourceType: PerResourceTypeEnum.app,
      resourceId: appId,
      session,
      teamId,
      tmbIdList: updateTmbIds,
      permission
    });

    // 同步子目录
    if (AppFolderTypeList.includes(app.type)) {
      await syncChildrenPermission({
        resource: app,
        resourceModel: MongoApp,
        folderTypeList: AppFolderTypeList,
        resourceType: PerResourceTypeEnum.app,
        collaborators: updateClbs,
        session
      });
    }
  });
}

export default NextAPI(handler);
