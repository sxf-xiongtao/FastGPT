import type { NextApiRequest } from 'next';
import { NextAPI } from '@/service/middleware/entry';
import { authApp } from '@fastgpt/service/support/permission/app/auth';
import {
  PerResourceTypeEnum,
  ManagePermissionVal
} from '@fastgpt/global/support/permission/constant';
import { AppCollaboratorDeleteParams } from '@fastgpt/global/core/app/collaborator';
import {
  syncChildrenPermission,
  syncCollaborators
} from '@fastgpt/service/support/permission/inheritPermission';
import { MongoApp } from '@fastgpt/service/core/app/schema';
import { AppFolderTypeList } from '@fastgpt/global/core/app/constants';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import {
  delResourcePermission,
  getResourceAllClbs
} from '@fastgpt/service/support/permission/controller';

/* 
  1. 继承态目录：需要将继承态关闭，删除 1 个协作者，同步其子目录协作者
  2. 继承态应用：需要将继承态关闭，同步父的 defaultPermission, 协作者复制父目录
  3. 非继承态目录：删除 1 个协作者，同步其子目录协作者
  4. 非继承态应用：仅删除协作者
*/

async function handler(req: NextApiRequest) {
  // Authorization
  const { appId, tmbId } = req.query as AppCollaboratorDeleteParams;

  const { teamId, app } = await authApp({
    req,
    authToken: true,
    appId,
    per: ManagePermissionVal
  });

  await mongoSessionRun(async (session) => {
    // 目录
    if (AppFolderTypeList.includes(app.type)) {
      const folderClbs = await getResourceAllClbs({
        teamId,
        resourceId: appId,
        resourceType: PerResourceTypeEnum.app,
        session
      });

      await delResourcePermission({
        resourceType: PerResourceTypeEnum.app,
        teamId,
        tmbId,
        resourceId: app._id,
        session
      });

      // 同步所有子资源协作者
      await syncChildrenPermission({
        resource: app,
        folderTypeList: AppFolderTypeList,
        resourceType: PerResourceTypeEnum.app,
        resourceModel: MongoApp,
        collaborators: folderClbs.filter((item) => String(item.tmbId) !== tmbId),
        session
      });
    } else {
      // 普通继承态应用
      if (app.inheritPermission && app.parentId) {
        // 获取父的所有协作者
        const parentClbs = await getResourceAllClbs({
          teamId,
          resourceId: app.parentId,
          resourceType: PerResourceTypeEnum.app,
          session
        });

        // 同步协作者
        await syncCollaborators({
          resourceType: PerResourceTypeEnum.app,
          teamId,
          resourceId: app._id,
          collaborators: parentClbs.filter((item) => String(item.tmbId) !== tmbId),
          session
        });
      } else {
        await delResourcePermission({
          resourceType: PerResourceTypeEnum.app,
          teamId,
          tmbId,
          resourceId: app._id,
          session
        });
      }
    }

    // 继承态：关闭继承态，修改默认权限为父级的默认权限（目录是多余同步，无所谓）
    if (app.inheritPermission) {
      const parent = await MongoApp.findById(app.parentId, 'defaultPermission')
        .session(session)
        .lean();

      await MongoApp.updateOne(
        { _id: appId },
        {
          inheritPermission: false,
          defaultPermission: parent?.defaultPermission ?? app.defaultPermission
        }
      ).session(session);
    }
  });
}

export default NextAPI(handler);
