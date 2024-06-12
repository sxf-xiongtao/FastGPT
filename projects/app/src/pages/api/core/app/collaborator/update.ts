import type { NextApiRequest, NextApiResponse } from 'next';
import { NextAPI } from '@/service/middleware/entry';

import { authApp } from '@fastgpt/service/support/permission/app/auth';
import {
  PerResourceTypeEnum,
  ManagePermissionVal
} from '@fastgpt/global/support/permission/constant';
import { UpdateAppCollaboratorBody } from '@fastgpt/global/core/app/collaborator';
import { AppPermission } from '@fastgpt/global/support/permission/app/controller';
import { updateResourcePermission } from '@/service/support/permission/controller';

async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  // Authorization
  const { appId, tmbIds, permission } = req.body as UpdateAppCollaboratorBody;

  const {
    teamId,
    tmbId,
    permission: myPer
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

  return updateResourcePermission({
    resourceId: appId,
    resourceType: PerResourceTypeEnum.app,
    teamId,
    tmbIdList: tmbIds,
    permission
  });
}

export default NextAPI(handler);
