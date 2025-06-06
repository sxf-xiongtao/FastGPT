import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { authApp } from '@fastgpt/service/support/permission/app/auth';
import { OwnerPermissionVal } from '@fastgpt/global/support/permission/constant';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { AppErrEnum } from '@fastgpt/global/common/error/code/app';
import { changeOwner } from '@/service/core/changeOwner';
import { AppTypeEnum } from '@fastgpt/global/core/app/constants';
import { addOperationLog } from '@fastgpt/service/support/operationLog/addOperationLog';
import { OperationLogEventEnum } from '@fastgpt/global/support/operationLog/constants';
import { getI18nAppType } from '@fastgpt/service/support/operationLog/util';
export type AppChangeOwnerQuery = {};
export type AppChangeOwnerBody = {
  ownerId: string;
  appId: string;
};
export type AppChangeOwnerResponse = any;

async function handler(
  req: ApiRequestProps<AppChangeOwnerBody, AppChangeOwnerQuery>,
  _res: ApiResponseType<any>
): Promise<AppChangeOwnerResponse> {
  const { ownerId, appId } = req.body;

  const { app, tmbId, teamId } = await authApp({
    req,
    appId,
    authToken: true,
    per: OwnerPermissionVal
  });

  const oldOwnerId = app.tmbId; // the old owner id before changing
  const newOwner = await MongoTeamMember.findById(ownerId); // the new owner
  const oldOwner = await MongoTeamMember.findById(oldOwnerId); // the old owner

  // it is forbidden to change the owner to a user who is not in the same team
  if (!newOwner || String(newOwner.teamId) !== String(app.teamId)) {
    return Promise.reject(AppErrEnum.invalidOwner);
  }

  // get the apps, whose ownerID are the oldOwnerId.
  const result = await changeOwner({
    changeOwnerType: 'app',
    resourceId: app._id,
    newOwnerId: ownerId,
    oldOwnerId: oldOwnerId,
    teamId: app.teamId
  });

  addOperationLog({
    tmbId,
    teamId,
    event: OperationLogEventEnum.TRANSFER_APP_OWNERSHIP,
    params: {
      appName: app.name,
      appType: getI18nAppType(app.type),
      oldOwnerName: oldOwner?.name || 'Unknown',
      newOwnerName: newOwner.name
    }
  });

  return result;
}

export default NextAPI(handler);
