import type { NextApiResponse } from 'next';
import { authDataset } from '@fastgpt/service/support/permission/dataset/auth';
import { crawlWebsite, type CrawlDataItemType } from '@/service/common/crawler';
import {
  DatasetCollectionTypeEnum,
  DatasetStatusEnum,
  DatasetCollectionDataProcessModeEnum
} from '@fastgpt/global/core/dataset/constants';
import { delay } from '@fastgpt/global/common/system/utils';
import { DatasetSchemaType } from '@fastgpt/global/core/dataset/type';
import { MongoDataset } from '@fastgpt/service/core/dataset/schema';
import { PostWebsiteSyncParams } from '@fastgpt/global/core/dataset/api.d';
import { delDatasetRelevantData } from '@fastgpt/service/core/dataset/controller';
import { updateWebSyncLimit } from '@fastgpt/service/support/user/utils';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import { checkTeamWebSyncPermission } from '@/service/support/permission/teamLimit';
import { MongoBill } from '@/service/support/wallet/bill/schema';
import { ManagePermissionVal } from '@fastgpt/global/support/permission/constant';
import { crawlDynamicWebsite } from '@/service/common/crawler/crawlDynamicWebsite';
import { addDays } from 'date-fns';
import { createCollectionAndInsertData } from '@fastgpt/service/core/dataset/collection/controller';
import { NextAPI } from '@/service/middleware/entry';
import { ApiRequestProps } from '@fastgpt/service/type/next';

// config
const maxCrawlPage = process.env.MAX_CRAWL_PAGE ? parseInt(process.env.MAX_CRAWL_PAGE) : 200;
const chunkSize = 768;
const dynamic = process.env.CRAWL_DYNAMIC_WEBSITE === 'true';

async function handler(req: ApiRequestProps<PostWebsiteSyncParams>, res: NextApiResponse) {
  const { datasetId, billId } = req.body;
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

    // update collection status to active
    setTimeout(async () => {
      await updateStatusToActive(datasetId);
    }, 20000);

    return;
  } catch (err) {
    try {
      MongoBill.findByIdAndDelete(billId);
      updateStatusToActive(datasetId);
    } catch (error) {}

    return Promise.reject(err);
  }
}

export default NextAPI(handler);

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
    await createCollectionAndInsertData({
      dataset,
      rawText: item.content,
      billId,
      createCollectionParams: {
        teamId: dataset.teamId,
        tmbId: dataset.tmbId,
        datasetId: dataset._id,
        type: DatasetCollectionTypeEnum.link,
        name: item.title || item.url,

        rawLink: item.url,

        trainingType: DatasetCollectionDataProcessModeEnum.chunk,
        imageIndex: true,

        chunkSize,
        metadata: {
          webPageSelector: dataset.websiteConfig?.selector?.trim() || ''
        },
        nextSyncTime: dataset.autoSync ? addDays(new Date(), 1) : undefined
      }
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
