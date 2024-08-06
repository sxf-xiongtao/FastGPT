import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { authApp } from '@fastgpt/service/support/permission/app/auth';
import {
  ManagePermissionVal,
  OwnerPermissionVal
} from '@fastgpt/global/support/permission/constant';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { AppErrEnum } from '@fastgpt/global/common/error/code/app';
import { MongoApp } from '@fastgpt/service/core/app/schema';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import { findAppAndAllChildren } from '@fastgpt/service/core/app/controller';
import { AppFolderTypeList } from '@fastgpt/global/core/app/constants';
import { updateCollaborator } from '@/service/support/permission/app/collaborator';

export type AppChangeOwnerQuery = {};
export type AppChangeOwnerBody = {
  ownerId: string;
  appId: string;
};
export type AppChangeOwnerResponse = {};

async function handler(
  req: ApiRequestProps<AppChangeOwnerBody, AppChangeOwnerQuery>,
  _res: ApiResponseType<any>
): Promise<AppChangeOwnerResponse> {
  const { ownerId, appId } = req.body;

  const { app, teamId } = await authApp({
    req,
    appId,
    authToken: true,
    per: OwnerPermissionVal
  });

  const oldOwnerId = app.tmbId; // the old owner id before changing
  const newOwner = await MongoTeamMember.findById(ownerId); // the new owner

  // it is forbidden to change the owner to a user who is not in the same team
  if (!newOwner || String(newOwner.teamId) !== String(app.teamId)) {
    return Promise.reject(AppErrEnum.invalidOwner);
  }

  await mongoSessionRun(async (session) => {
    // 1. update the owner of the app, and set the inheritPermission to false
    await MongoApp.updateOne(
      { _id: appId, teamId, tmbId: oldOwnerId },
      { tmbId: ownerId },
      { session }
    );

    // 2. add the old owner to the collaborator list with ManagePermissionVal
    // In this function, the children resource will be updated in the same time.
    // await updateCollaborator({
    //   tmbIds: [oldOwnerId],
    //   permission: ManagePermissionVal,
    //   app,
    //   teamId,
    //   session
    // });

    // if the app is not a folder, just return. because apps do not have children
    if (!AppFolderTypeList.includes(app.type)) {
      return;
    }

    // the following code is for the folder
    // get the apps, which are the children of the app and the app's ownerID is the oldOwnerId
    const apps = (
      await findAppAndAllChildren({
        teamId: app.teamId,
        appId
      })
    ).filter((app) => String(app.tmbId) === String(oldOwnerId));

    // update the owner of the apps and add the old owner to the collaborator list with ManagePermissionVal

    await MongoApp.updateMany(
      {
        _id: {
          $in: apps.map((item) => {
            item._id;
          })
        },
        tmbId: oldOwnerId,
        teamId
      },
      { tmbId: ownerId },
      { session }
    );

    // for await (const app of apps) {
    // it is unnessary to add the old owner to the collaborator list with ManagePermissionVal
    // when the app has inheritPermission as true,
    // because in the code above, the old owner has been added to the collaborator list with ManagePermissionVal
    // via updateCollaborator function.
    // if (app.inheritPermission === true) {
    //   continue;
    // }

    // add the old owner to the collaborator list with ManagePermissionVal, when the app has inheritPermission as false
    //   await updateCollaborator({
    //     tmbIds: [oldOwnerId],
    //     permission: ManagePermissionVal,
    //     app,
    //     teamId,
    //     session
    //   });
    // }
  });

  return {};
}

export default NextAPI(handler);
