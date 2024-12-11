import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { authDataset } from '@fastgpt/service/support/permission/dataset/auth';
import { crawlWebsite, type CrawlDataItemType } from '@/service/common/crawler';
import { MongoDatasetCollection } from '@fastgpt/service/core/dataset/collection/schema';
import {
  TrainingModeEnum,
  DatasetCollectionTypeEnum,
  DatasetStatusEnum
} from '@fastgpt/global/core/dataset/constants';
import { delay } from '@fastgpt/global/common/system/utils';
import { DatasetSchemaType } from '@fastgpt/global/core/dataset/type';
import { MongoDataset } from '@fastgpt/service/core/dataset/schema';
import { PostWebsiteSyncParams } from '@fastgpt/global/core/dataset/api.d';
import { delDatasetRelevantData } from '@fastgpt/service/core/dataset/controller';
import { updateWebSyncLimit } from '@fastgpt/service/support/user/utils';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import { splitText2Chunks } from '@fastgpt/global/common/string/textSplitter';
import { MongoDatasetTraining } from '@fastgpt/service/core/dataset/training/schema';
import { checkTeamWebSyncPermission } from '@/service/support/permission/teamLimit';
import { MongoBill } from '@/service/support/wallet/bill/schema';
import { WritePermissionVal } from '@fastgpt/global/support/permission/constant';
import { crawlDynamicWebsite } from '@/service/common/crawler/crawlDynamicWebsite';
import { addDays } from 'date-fns';

// config
const maxCrawlPage = process.env.MAX_CRAWL_PAGE ? parseInt(process.env.MAX_CRAWL_PAGE) : 200;
const chunkSize = 768;
const dynamic = process.env.CRAWL_DYNAMIC_WEBSITE === 'true';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { datasetId, billId } = req.body as PostWebsiteSyncParams;
  try {
    await connectToDatabase();

    const { dataset, teamId } = await authDataset({
      datasetId,
      req,
      authToken: true,
      per: WritePermissionVal
    });

    if (!dataset?.websiteConfig?.url) {
      throw new Error('Dataset is not website dataset');
    }

    await checkTeamWebSyncPermission(teamId);

    // 1. clear dataset all data
    await mongoSessionRun((session) => delDatasetRelevantData({ datasets: [dataset], session }));

    // 2. crawl all website
    const crawl = dynamic ? crawlDynamicWebsite : crawlWebsite;
    crawl({
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

    // update collection status to active
    setTimeout(async () => {
      await updateStatusToActive(datasetId);
    }, 20000);
  } catch (err) {
    try {
      MongoBill.findByIdAndDelete(billId);
      updateStatusToActive(datasetId);
    } catch (error) {}
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
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
    // split data
    const { chunks } = splitText2Chunks({
      text: item.content,
      chunkLen: chunkSize
    });

    await mongoSessionRun(async (session) => {
      // create collection
      const [collection] = await MongoDatasetCollection.create(
        [
          {
            parentId: null,
            teamId: dataset.teamId,
            tmbId: dataset.tmbId,
            datasetId: dataset._id,
            type: DatasetCollectionTypeEnum.link,
            name: item.title || item.url,
            trainingType: TrainingModeEnum.chunk,
            chunkSize,
            rawLink: item.url,
            metadata: {
              webPageSelector: dataset.websiteConfig?.selector?.trim() || ''
            },
            nextSyncTime: dataset.autoSync ? addDays(new Date(), 1) : undefined
          }
        ],
        { session }
      );

      // insert to training queue
      const model = dataset.vectorModel;
      await MongoDatasetTraining.insertMany(
        chunks.map((item, i) => ({
          teamId: dataset.teamId,
          tmbId: dataset.tmbId,
          datasetId: dataset._id,
          collectionId: collection._id,
          billId,
          mode: collection.trainingType,
          prompt: '',
          model,
          q: item,
          a: '',
          chunkIndex: i
        })),
        { session }
      );
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
