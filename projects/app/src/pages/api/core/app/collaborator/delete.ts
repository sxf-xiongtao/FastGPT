import type { NextApiRequest, NextApiResponse } from 'next';
import { NextAPI } from '@/service/middleware/entry';
import { authApp } from '@fastgpt/service/support/permission/app/auth';
import {
  PerResourceTypeEnum,
  ManagePermissionVal
} from '@fastgpt/global/support/permission/constant';
import { AppCollaboratorDeleteParams } from '@fastgpt/global/core/app/collaborator';
import { getResourcePermission } from '@fastgpt/service/support/permission/controller';
import { AppPermission } from '@fastgpt/global/support/permission/app/controller';

async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  // Authorization
  const { appId, tmbId } = req.query as AppCollaboratorDeleteParams;

  const { teamId, permission } = await authApp({
    req,
    authToken: true,
    appId,
    per: ManagePermissionVal
  });

  const rp = await getResourcePermission({
    teamId,
    tmbId,
    resourceId: appId,
    resourceType: PerResourceTypeEnum.app
  });

  if (!rp) {
    return Promise.reject('Not Collaborator!');
  }

  if (!permission.isOwner && new AppPermission({ per: rp.permission }).hasManagePer) {
    return Promise.reject('You can not delete a manager!');
  }

  return await rp.deleteOne();
}

export default NextAPI(handler);
