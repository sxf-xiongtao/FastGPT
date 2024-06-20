import type { NextApiRequest } from 'next';
import { NextAPI } from '@/service/middleware/entry';

import { authDataset } from '@fastgpt/service/support/permission/dataset/auth';
import {
  PerResourceTypeEnum,
  ManagePermissionVal
} from '@fastgpt/global/support/permission/constant';
import { UpdateDatasetCollaboratorBody } from '@fastgpt/global/core/dataset/collaborator';
import { DatasetPermission } from '@fastgpt/global/support/permission/dataset/controller';
import { updateResourcePermission } from '@/service/support/permission/controller';

async function handler(req: NextApiRequest) {
  // Authorization
  const { datasetId, tmbIds, permission } = req.body as UpdateDatasetCollaboratorBody;

  const {
    teamId,
    tmbId,
    permission: myPer
  } = await authDataset({
    req,
    authToken: true,
    datasetId,
    per: ManagePermissionVal
  });

  if (tmbIds.includes(tmbId)) {
    return Promise.reject('Can not update your own permission');
  }

  if (new DatasetPermission({ per: permission }).hasManagePer && !myPer.isOwner) {
    return Promise.reject('Only owner could grant manage permission');
  }

  return updateResourcePermission({
    resourceId: datasetId,
    resourceType: PerResourceTypeEnum.dataset,
    teamId,
    tmbIdList: tmbIds,
    permission
  });
}

export default NextAPI(handler);
