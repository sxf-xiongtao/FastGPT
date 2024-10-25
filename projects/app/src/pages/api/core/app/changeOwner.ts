import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { authApp } from '@fastgpt/service/support/permission/app/auth';
import {
  OwnerPermissionVal,
  PerResourceTypeEnum
} from '@fastgpt/global/support/permission/constant';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { AppErrEnum } from '@fastgpt/global/common/error/code/app';
import { MongoApp } from '@fastgpt/service/core/app/schema';
import { findAppAndAllChildren } from '@fastgpt/service/core/app/controller';
import {
  delResourcePermission,
  getResourceClbsAndGroups
} from '@fastgpt/service/support/permission/controller';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import { AppFolderTypeList } from '@fastgpt/global/core/app/constants';
import {
  syncChildrenPermission,
  syncCollaborators,
  UpdateCollaboratorItem
} from '@fastgpt/service/support/permission/inheritPermission';
import { updateResourcePermission } from '@/service/support/permission/controller';

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

  // get the apps, which are the children of the app and the app's ownerID is the oldOwnerId
  const apps = (
    await findAppAndAllChildren({
      teamId: app.teamId,
      appId
    })
  ).filter((app) => String(app.tmbId) === String(oldOwnerId));

  // update the owner of the apps and add the old owner to the collaborator list with ManagePermissionVal
  mongoSessionRun(async (session) => {
    const isFolder = AppFolderTypeList.includes(app.type);
    await MongoApp.updateMany(
      {
        _id: {
          $in: apps.map((item) => item._id)
        },
        tmbId: oldOwnerId,
        teamId
      },
      {
        tmbId: ownerId,
        ...(isFolder ? { inheritPermission: false } : {})
      },
      { session }
    );

    if (isFolder) {
      const oldClbsAndGroups = await getResourceClbsAndGroups({
        session,
        resourceType: PerResourceTypeEnum.app,
        resourceId: app._id,
        teamId
      });

      const updateClbsAndGroups: UpdateCollaboratorItem[] = [];

      updateClbsAndGroups.push(
        ...oldClbsAndGroups.filter(
          ({ tmbId }) => String(tmbId) !== String(oldOwnerId) && String(tmbId) !== String(ownerId)
        ),
        {
          tmbId: ownerId,
          permission: OwnerPermissionVal
        }
      );

      await syncCollaborators({
        resourceType: PerResourceTypeEnum.app,
        resourceId: app._id,
        collaborators: updateClbsAndGroups,
        teamId,
        session
      });

      await syncChildrenPermission({
        resourceType: PerResourceTypeEnum.app,
        resource: app,
        resourceModel: MongoApp,
        folderTypeList: AppFolderTypeList,
        collaborators: updateClbsAndGroups,
        session
      });
    }
  });

  return {};
}

export default NextAPI(handler);
