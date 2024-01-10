import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { authDataset } from '@fastgpt/service/support/permission/auth/dataset';
import { crawlWebsite, type CrawlDataItemType } from '@/service/common/crawler';
import { MongoDatasetCollection } from '@fastgpt/service/core/dataset/collection/schema';
import {
  TrainingModeEnum,
  DatasetCollectionTypeEnum,
  DatasetStatusEnum
} from '@fastgpt/global/core/dataset/constant';
import { delay } from '@fastgpt/global/common/system/utils';
import { DatasetSchemaType } from '@fastgpt/global/core/dataset/type';
import { MongoDataset } from '@fastgpt/service/core/dataset/schema';
import { PostWebsiteSyncParams } from '@fastgpt/global/core/dataset/api.d';
import { delDatasetRelevantData } from '@fastgpt/service/core/dataset/data/controller';
import { reloadCollectionChunks } from '@fastgpt/service/core/dataset/collection/utils';
import { updateWebSyncLimit } from '@fastgpt/service/support/user/utils';

// config
const maxCrawlPage = 200;
const chunkSize = 768;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { datasetId, billId } = req.body as PostWebsiteSyncParams;
  try {
    await connectToDatabase();

    const { dataset, teamId } = await authDataset({
      datasetId,
      req,
      authToken: true,
      per: 'w'
    });

    if (!dataset?.websiteConfig?.url) {
      throw new Error('Dataset is not website dataset');
    }

    // 1. clear dataset all data
    await delDatasetRelevantData({ datasetIds: [dataset._id] });

    // 2. crawl all website
    crawlWebsite({
      uid: datasetId,
      url: dataset.websiteConfig.url.trim(),
      maxPage: maxCrawlPage,
      selector: dataset.websiteConfig?.selector?.trim() || 'body',
      crawlOnePageCallback: async (item, stopCrawler) => {
        try {
          if (await checkDatasetExist(datasetId)) {
            createCollectionAndPushData({
              dataset,
              item,
              billId,
              retry: 3
            });
          } else {
            stopCrawler();
          }
        } catch (error) {}
      }
    });

    updateWebSyncLimit(teamId);

    jsonRes(res, {
      data: []
    });
  } catch (err) {
    try {
    } catch (error) {}
    jsonRes(res, {
      code: 500,
      error: err
    });
  }

  // update collection status to active
  setTimeout(async () => {
    await updateStatusToActive(datasetId);
  }, 20000);
}

async function checkDatasetExist(datasetId: string) {
  const dataset = await MongoDataset.findById(datasetId);
  return !!dataset;
}

async function createCollectionAndPushData(props: {
  dataset: DatasetSchemaType;
  item: CrawlDataItemType;
  billId?: string;
  retry: number;
}): Promise<any> {
  const { dataset, item, billId, retry } = props;

  try {
    // create collection
    const { _id: collectionId } = await MongoDatasetCollection.create({
      parentId: null,
      teamId: dataset.teamId,
      tmbId: dataset.tmbId,
      datasetId: dataset._id,
      type: DatasetCollectionTypeEnum.link,
      name: item.title || item.url,
      trainingType: TrainingModeEnum.chunk,
      chunkSize,
      rawLink: item.url,
      metadata: {}
    });

    await reloadCollectionChunks({
      collectionId,
      tmbId: dataset.tmbId,
      billId,
      rawText: item.content
    });
  } catch (err) {
    console.log(err, retry);

    await delay(100);
    if (retry > 0) {
      return createCollectionAndPushData({
        ...props,
        retry: retry - 1
      });
    }
    return Promise.reject(err);
  }
}

async function updateStatusToActive(datasetId: string): Promise<void> {
  try {
    await MongoDataset.findByIdAndUpdate(datasetId, {
      status: DatasetStatusEnum.active
    });
  } catch (error) {
    await delay(2000);
    return updateStatusToActive(datasetId);
  }
}
