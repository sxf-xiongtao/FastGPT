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
  getParentCollaborators,
  syncChildrenPermission,
  updateCollaborators
} from '@fastgpt/service/support/permission/inheritPermission';
import { MongoResourcePermission } from '@fastgpt/service/support/permission/schema';
import { MongoApp } from '@fastgpt/service/core/app/schema';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';

async function handler(req: NextApiRequest) {
  // Authorization
  const { appId, tmbIds, permission } = req.body as UpdateAppCollaboratorBody;

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

  mongoSessionRun(async (session) => {
    const isInherit = app.inheritPermission;
    const collaborators = await (async () => {
      if (isInherit && app.parentId) {
        // inheritPermission and not root
        // 1. update the App to remove the inheritPermission

        // change the resourceId to the parent app id
        const parentClbs = await getParentCollaborators({
          resource: app,
          resourceType: PerResourceTypeEnum.app,
          session
        });
        const clbs = parentClbs
          .filter((item) => !tmbIds.includes(item.tmbId))
          .map((item) => {
            return {
              resourceId: appId,
              resourceType: PerResourceTypeEnum.app,
              teamId,
              tmbId: item.tmbId,
              permission: item.permission
            };
          });

        tmbIds.forEach((tmbId) => {
          clbs.push({
            resourceId: appId,
            resourceType: PerResourceTypeEnum.app,
            teamId,
            tmbId,
            permission
          });
        });

        for (const clb of clbs) {
          await MongoResourcePermission.updateOne(
            {
              resourceId: clb.resourceId,
              resourceType: clb.resourceType,
              teamId: clb.teamId,
              tmbId: clb.tmbId
            },
            {
              permission: clb.permission
            },
            { upsert: true, session }
          );
        }
        await MongoApp.findOneAndUpdate(
          { _id: appId },
          {
            inheritPermission: false
          },
          {
            session
          }
        );
        return clbs;
      } else {
        const myClbs = await MongoResourcePermission.find({
          resourceId: appId,
          resourceType: PerResourceTypeEnum.app,
          teamId
        })
          .session(session)
          .lean();

        const clbs = myClbs
          .filter((item) => !tmbIds.includes(String(item.tmbId)))
          .map((item) => {
            return {
              resourceId: appId,
              resourceType: PerResourceTypeEnum.app,
              teamId,
              tmbId: item.tmbId,
              permission: item.permission
            };
          });

        tmbIds.forEach((tmbId) => {
          clbs.push({
            resourceId: appId,
            resourceType: PerResourceTypeEnum.app,
            teamId,
            tmbId,
            permission
          });
        });

        await updateCollaborators({
          resourceType: PerResourceTypeEnum.app,
          resourceId: appId,
          session,
          teamId,
          collaborators: clbs
        });
        return clbs;
      }
    })();

    await syncChildrenPermission({
      resource: app,
      resourceModel: MongoApp,
      folderTypeList: AppFolderTypeList,
      resourceType: PerResourceTypeEnum.app,
      collaborators,
      session
    });
  });
}

export default NextAPI(handler);
