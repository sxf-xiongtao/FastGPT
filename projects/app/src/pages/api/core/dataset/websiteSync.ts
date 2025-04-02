import type { NextApiResponse } from 'next';
import { authDataset } from '@fastgpt/service/support/permission/dataset/auth';
import { PostWebsiteSyncParams } from '@fastgpt/global/core/dataset/api.d';
import { updateWebSyncLimit } from '@fastgpt/service/support/user/utils';
import { checkTeamWebSyncPermission } from '@/service/support/permission/teamLimit';
import { ManagePermissionVal } from '@fastgpt/global/support/permission/constant';
import { NextAPI } from '@/service/middleware/entry';
import { ApiRequestProps } from '@fastgpt/service/type/next';
import { addWebsiteSyncJob } from '@fastgpt/service/core/dataset/websiteSync';

async function handler(req: ApiRequestProps<PostWebsiteSyncParams>, res: NextApiResponse) {
  const { datasetId } = req.body;
  try {
    const { dataset, teamId } = await authDataset({
      datasetId,
      req,
      authToken: true,
      per: ManagePermissionVal
    });

    if (!dataset?.websiteConfig?.url) {
      throw new Error('Dataset is not website dataset');
    }

    await checkTeamWebSyncPermission(teamId);

    await addWebsiteSyncJob({ datasetId: dataset._id.toString() });

    updateWebSyncLimit(teamId);

    return;
  } catch (err) {
    return Promise.reject(err);
  }
}

export default NextAPI(handler);
