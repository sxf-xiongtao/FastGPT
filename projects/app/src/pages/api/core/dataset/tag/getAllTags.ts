import { authDataset } from '@fastgpt/service/support/permission/dataset/auth';
import { ReadPermissionVal } from '@fastgpt/global/support/permission/constant';
import { NextAPI } from '@/service/middleware/entry';
import { MongoDatasetCollectionTags } from '@fastgpt/service/core/dataset/tag/schema';
import { ApiRequestProps } from '@fastgpt/service/type/next';

async function handler(
  req: ApiRequestProps<
    {},
    {
      datasetId: string;
    }
  >
) {
  let { datasetId } = req.query;
  if (!datasetId) {
    return [];
  }

  const { teamId } = await authDataset({
    req,
    authToken: true,
    authApiKey: true,
    datasetId,
    per: ReadPermissionVal
  });

  const tags = await MongoDatasetCollectionTags.find({
    teamId,
    datasetId
  })
    .sort({ _id: -1 })
    .lean();

  return {
    list: tags
  };
}

export default NextAPI(handler);
