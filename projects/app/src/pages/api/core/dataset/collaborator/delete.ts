import type { NextApiRequest } from 'next';
import { NextAPI } from '@/service/middleware/entry';
import { authDataset } from '@fastgpt/service/support/permission/dataset/auth';
import {
  PerResourceTypeEnum,
  ManagePermissionVal
} from '@fastgpt/global/support/permission/constant';
import { DatasetCollaboratorDeleteParams } from '@fastgpt/global/core/dataset/collaborator';
import { getResourcePermission } from '@fastgpt/service/support/permission/controller';
import { DatasetPermission } from '@fastgpt/global/support/permission/dataset/controller';

async function handler(req: NextApiRequest) {
  // Authorization
  const { datasetId, tmbId } = req.query as DatasetCollaboratorDeleteParams;

  const { teamId, permission } = await authDataset({
    req,
    authToken: true,
    datasetId,
    per: ManagePermissionVal
  });

  const rp = await getResourcePermission({
    teamId,
    tmbId,
    resourceId: datasetId,
    resourceType: PerResourceTypeEnum.dataset
  });

  if (!rp) {
    return Promise.reject('Not Collaborator!');
  }

  if (!permission.isOwner && new DatasetPermission({ per: rp.permission }).hasManagePer) {
    return Promise.reject('You can not delete a manager!');
  }

  return await rp.deleteOne();
}

export default NextAPI(handler);
