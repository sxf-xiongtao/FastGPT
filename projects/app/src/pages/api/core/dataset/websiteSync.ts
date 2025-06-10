import type { NextApiResponse } from 'next';
import { authDataset } from '@fastgpt/service/support/permission/dataset/auth';
import { PostWebsiteSyncParams } from '@fastgpt/global/core/dataset/api.d';
import { updateWebSyncLimit } from '@fastgpt/service/support/user/utils';
import { checkTeamWebSyncPermission } from '@fastgpt/service/support/permission/teamLimit';
import { ManagePermissionVal } from '@fastgpt/global/support/permission/constant';
import { NextAPI } from '@/service/middleware/entry';
import { ApiRequestProps } from '@fastgpt/service/type/next';
import {
  addWebsiteSyncJob,
  getWebsiteSyncDatasetStatus
} from '@fastgpt/service/core/dataset/websiteSync';
import { DatasetStatusEnum } from '@fastgpt/global/core/dataset/constants';
import { MongoDatasetTraining } from '@fastgpt/service/core/dataset/training/schema';

async function handler(req: ApiRequestProps<PostWebsiteSyncParams>, res: NextApiResponse) {
  const { datasetId } = req.body;

  const { dataset, teamId } = await authDataset({
    datasetId,
    req,
    authToken: true,
    per: ManagePermissionVal
  });

  if (!dataset?.websiteConfig?.url) {
    throw new Error('Dataset is not website dataset');
  }

  // Check it is already syncing
  const { status } = await getWebsiteSyncDatasetStatus(datasetId);
  if (status === DatasetStatusEnum.syncing) {
    return Promise.reject('Dataset is syncing');
  }

  // Check is training
  const trainingCounts = await MongoDatasetTraining.countDocuments({
    teamId,
    datasetId
  });
  if (trainingCounts > 0) {
    return Promise.reject('Dataset is training');
  }

  await checkTeamWebSyncPermission(teamId);

  await addWebsiteSyncJob({ datasetId: dataset._id.toString() });

  updateWebSyncLimit(teamId);
}

export default NextAPI(handler);
