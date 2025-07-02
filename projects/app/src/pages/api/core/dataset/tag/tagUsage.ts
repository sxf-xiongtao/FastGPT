/*
  find collections of the tag
*/
import type { NextApiRequest, NextApiResponse } from 'next';
import { Types } from '@fastgpt/service/common/mongo';
import { MongoDatasetCollection } from '@fastgpt/service/core/dataset/collection/schema';
import { authDataset } from '@fastgpt/service/support/permission/dataset/auth';
import { NextAPI } from '@/service/middleware/entry';
import { ReadPermissionVal } from '@fastgpt/global/support/permission/constant';
import type { TagUsageType } from '@fastgpt/global/core/dataset/type';

async function handler(req: NextApiRequest, res: NextApiResponse<TagUsageType>) {
  const { datasetId } = req.query as { datasetId: string };

  const { teamId } = await authDataset({
    req,
    authToken: true,
    authApiKey: true,
    datasetId,
    per: ReadPermissionVal
  });

  const tagUsage = await MongoDatasetCollection.aggregate([
    { $match: { datasetId: new Types.ObjectId(datasetId), teamId: new Types.ObjectId(teamId) } },
    { $unwind: '$tags' },
    { $group: { _id: '$tags', collections: { $push: '$_id' } } },
    { $project: { tagId: '$_id', collections: 1, _id: 0 } }
  ]);

  return tagUsage;
}

export default NextAPI(handler);
