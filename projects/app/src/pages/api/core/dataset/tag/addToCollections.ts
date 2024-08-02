import type { NextApiRequest, NextApiResponse } from 'next';
import type { AddTagsToCollectionsParams } from '@fastgpt/global/core/dataset/api.d';
import { NextAPI } from '@/service/middleware/entry';
import { MongoDatasetCollection } from '@fastgpt/service/core/dataset/collection/schema';
import { authDatasetCollection } from '@fastgpt/service/support/permission/dataset/auth';
import { WritePermissionVal } from '@fastgpt/global/support/permission/constant';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { collectionIds, tag, datasetId, originCollectionIds } =
    req.body as AddTagsToCollectionsParams;

  if (!collectionIds || !tag || !originCollectionIds) {
    return res.status(400).json({ error: 'missingParams' });
  }

  const collectionIdsSet = new Set(collectionIds);
  const originCollectionIdsSet = new Set(originCollectionIds);

  const collectionsToAddTag = collectionIds.filter((id) => !originCollectionIdsSet.has(id));
  const collectionsToRemoveTag = originCollectionIds.filter((id) => !collectionIdsSet.has(id));

  for (const collectionId of [...collectionsToAddTag, ...collectionsToRemoveTag]) {
    await authDatasetCollection({
      req,
      authToken: true,
      authApiKey: true,
      collectionId,
      per: WritePermissionVal
    });
  }

  await Promise.all([
    collectionsToAddTag.length > 0
      ? MongoDatasetCollection.updateMany(
          { _id: { $in: collectionsToAddTag }, datasetId },
          { $addToSet: { tags: tag } }
        )
      : Promise.resolve(),
    collectionsToRemoveTag.length > 0
      ? MongoDatasetCollection.updateMany(
          { _id: { $in: collectionsToRemoveTag }, datasetId },
          { $pull: { tags: tag } }
        )
      : Promise.resolve()
  ]);

  return {};
}

export default NextAPI(handler);
