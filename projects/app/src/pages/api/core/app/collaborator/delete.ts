import type { NextApiRequest } from 'next';
import { NextAPI } from '@/service/middleware/entry';
import { authApp } from '@fastgpt/service/support/permission/app/auth';
import {
  PerResourceTypeEnum,
  ManagePermissionVal
} from '@fastgpt/global/support/permission/constant';
import { AppCollaboratorDeleteParams } from '@fastgpt/global/core/app/collaborator';
import { AppPermission } from '@fastgpt/global/support/permission/app/controller';
import {
  getParentCollaborators,
  syncChildrenPermission,
  updateCollaborators
} from '@fastgpt/service/support/permission/inheritPermission';
import { MongoApp } from '@fastgpt/service/core/app/schema';
import { AppFolderTypeList } from '@fastgpt/global/core/app/constants';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import { MongoResourcePermission } from '@fastgpt/service/support/permission/schema';

async function handler(req: NextApiRequest) {
  // Authorization
  const { appId, tmbId } = req.query as AppCollaboratorDeleteParams;

  const { teamId, permission, app } = await authApp({
    req,
    authToken: true,
    appId,
    per: ManagePermissionVal
  });

  mongoSessionRun(async (session) => {
    if (app.inheritPermission) {
      const parent = app.parentId
        ? await MongoApp.findById(app.parentId).session(session)
        : undefined;
      await MongoApp.updateOne(
        { _id: appId },
        { inheritPermission: false, defaultPermission: parent?.defaultPermission }
      ).session(session);
    }

    if (AppFolderTypeList.includes(app.type) || app.inheritPermission === false || !app.parentId) {
      // is Folder
      const clbs = await MongoResourcePermission.find({
        resourceId: appId,
        resourceType: PerResourceTypeEnum.app,
        teamId
      })
        .lean()
        .session(session);

      const rp = clbs.find((item) => String(item.tmbId) === tmbId);

      if (!clbs || !rp) {
        return Promise.reject('Not Collaborator!');
      }

      if (!permission.isOwner && new AppPermission({ per: rp.permission }).hasManagePer) {
        return Promise.reject('You can not delete a manager!');
      }

      await MongoResourcePermission.deleteOne({ _id: rp._id }).session(session);
      clbs.splice(clbs.indexOf(rp), 1);

      await syncChildrenPermission({
        resource: app,
        folderTypeList: AppFolderTypeList,
        resourceType: PerResourceTypeEnum.app,
        resourceModel: MongoApp,
        collaborators: clbs,
        session
      });
      return;
    } else {
      // is a app
      const parentClbs = app.parentId
        ? await getParentCollaborators({
            resource: app,
            resourceType: PerResourceTypeEnum.app,
            session
          })
        : undefined;

      const deletedClb = parentClbs?.find((item) => String(item.tmbId) === tmbId);

      console.log('parentClbs', parentClbs);
      console.log('deletedClb', deletedClb);

      if (!deletedClb) {
        return Promise.reject('Not Collaborator!');
      }

      if (!permission.isOwner && new AppPermission({ per: deletedClb.permission }).hasManagePer) {
        return Promise.reject('You can not delete a manager!');
      }

      await updateCollaborators({
        resourceId: String(app._id),
        teamId: String(teamId),
        resourceType: PerResourceTypeEnum.app,
        collaborators: parentClbs!
          .filter((item) => String(item._id) !== String(deletedClb._id))
          .map((item) => {
            return {
              tmbId: item.tmbId,
              permission: item.permission,
              resourceType: item.resourceType,
              teamId: item.teamId,
              resourceId: item.resourceId
            };
          }),
        session
      });
      // no need to sync
    }
  });
}

export default NextAPI(handler);
