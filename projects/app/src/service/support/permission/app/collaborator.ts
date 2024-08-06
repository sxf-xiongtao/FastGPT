import { AppFolderTypeList } from '@fastgpt/global/core/app/constants';
import { AppSchema } from '@fastgpt/global/core/app/type';
import { PerResourceTypeEnum } from '@fastgpt/global/support/permission/constant';
import { PermissionValueType } from '@fastgpt/global/support/permission/type';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import { MongoApp } from '@fastgpt/service/core/app/schema';
import { getResourceAllClbs } from '@fastgpt/service/support/permission/controller';
import {
  syncChildrenPermission,
  UpdateCollaboratorItem
} from '@fastgpt/service/support/permission/inheritPermission';
import { MongoResourcePermission } from '@fastgpt/service/support/permission/schema';
import { updateResourcePermission } from '../controller';
import { ClientSession } from 'mongoose';

export type updateCollaboratorProps = {
  tmbIds: string[];
  permission: PermissionValueType;
  app: AppSchema;
  teamId: string;
  session: ClientSession;
};

// copied directlf from projects/app/src/pages/api/core/app/collaborator/update.ts
/* 
  增加或修改协作者
  1. 继承态目录：关闭继承态，更新新的协作者，同步其继承态子目录协作者
  2. 继承态应用：关闭继承态，复制父级协作者，并更新新的协作者
  3. 非继承态目录：更新新的协作者，同步其子目录协作者
  4. 非继承态应用：更新新的协作者
*/
export const updateCollaborator = async ({
  permission,
  app,
  teamId,
  tmbIds,
  session
}: updateCollaboratorProps) => {
  const isFolder = AppFolderTypeList.includes(app.type);

  const callback = async (session: ClientSession) => {
    // 关闭继承态
    if (app.inheritPermission && app.parentId) {
      await MongoApp.updateOne(
        { _id: app._id },
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
          resourceId: app._id,
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
            FolderClbs.filter((item) => !tmbIds.includes(String(item.tmbId))).map((item) => ({
              tmbId: item.tmbId,
              permission: tmbIds.includes(String(item.tmbId)) ? permission : item.permission
            }))
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
              resourceId: app._id,
              resourceType: PerResourceTypeEnum.app,
              tmbId: item.tmbId,
              permission: item.permission
            })),
            { session }
          );

          return {
            updateClbs,
            updateTmbIds: updateClbs.map((item) => item.tmbId) // 继承态 app 是没有协作者的，这里需要全量复制
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
      resourceId: app._id,
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
  };

  if (session) {
    await callback(session);
  } else {
    await mongoSessionRun(callback);
  }
};
