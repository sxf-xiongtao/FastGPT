import type { NextApiResponse } from 'next';
import { authDataset } from '@fastgpt/service/support/permission/dataset/auth';
import type { PostDatasetSyncParams } from '@fastgpt/global/core/dataset/api.d';
import { updateWebSyncLimit } from '@fastgpt/service/support/user/utils';
import { checkTeamDatasetSyncPermission } from '@fastgpt/service/support/permission/teamLimit';
import { ManagePermissionVal } from '@fastgpt/global/support/permission/constant';
import { NextAPI } from '@/service/middleware/entry';
import type { ApiRequestProps } from '@fastgpt/service/type/next';
import {
  addDatasetSyncJob,
  getDatasetSyncDatasetStatus
} from '@fastgpt/service/core/dataset/datasetSync';
import { DatasetStatusEnum } from '@fastgpt/global/core/dataset/constants';
import { MongoDatasetTraining } from '@fastgpt/service/core/dataset/training/schema';
import { DatasetTypeEnum } from '@fastgpt/global/core/dataset/constants';

async function handler(req: ApiRequestProps<PostDatasetSyncParams>, res: NextApiResponse) {
  const { datasetId } = req.body;

  const { dataset, teamId } = await authDataset({
    datasetId,
    req,
    authToken: true,
    per: ManagePermissionVal
  });

  // Check it is already syncing
  const { status } = await getDatasetSyncDatasetStatus(datasetId);
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

  if (dataset.type === DatasetTypeEnum.websiteDataset) {
    await checkTeamDatasetSyncPermission(teamId);
  }

  await addDatasetSyncJob({ datasetId: dataset._id.toString() });

  if (dataset.type === DatasetTypeEnum.websiteDataset) {
    updateWebSyncLimit(teamId);
  }
}

export default NextAPI(handler);
