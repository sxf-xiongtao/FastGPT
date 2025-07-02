import type { Job } from '@fastgpt/service/common/bullmq';
import { UnrecoverableError } from '@fastgpt/service/common/bullmq';
import { crawlWebsite, type CrawlDataItemType } from '@/service/common/crawler';
import {
  DatasetCollectionTypeEnum,
  DatasetCollectionDataProcessModeEnum,
  ChunkSettingModeEnum,
  DataChunkSplitModeEnum
} from '@fastgpt/global/core/dataset/constants';
import { retryFn } from '@fastgpt/global/common/system/utils';
import type {
  DatasetCollectionSchemaType,
  DatasetSchemaType
} from '@fastgpt/global/core/dataset/type';
import { MongoDataset } from '@fastgpt/service/core/dataset/schema';
import { crawlDynamicWebsite } from '@/service/common/crawler/crawlDynamicWebsite';
import {
  createCollectionAndInsertData,
  delCollection
} from '@fastgpt/service/core/dataset/collection/controller';
import { hashStr } from '@fastgpt/global/common/string/tools';
import { MongoDatasetCollection } from '@fastgpt/service/core/dataset/collection/schema';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import { addLog } from '@fastgpt/service/common/system/log';
import {
  getWebsiteSyncWorker,
  removeWebsiteSyncJobScheduler,
  type WebsiteSyncJobData
} from '@fastgpt/service/core/dataset/websiteSync';

export const initWebsiteSyncWorker = () => {
  addLog.info('Init WebsiteSync Worker...');
  return getWebsiteSyncWorker(processor);
};

// config
const maxCrawlPage = process.env.MAX_CRAWL_PAGE ? parseInt(process.env.MAX_CRAWL_PAGE) : 200;
const dynamic = process.env.CRAWL_DYNAMIC_WEBSITE === 'true';

// TODO: split complex job into small queue jobs
const processor = async (job: Job<WebsiteSyncJobData>) => {
  const createCollectionAndPushData = async (props: {
    dataset: DatasetSchemaType;
    item: CrawlDataItemType;
  }) => {
    const { dataset, item } = props;
    const chunkSettings = dataset.chunkSettings;

    await createCollectionAndInsertData({
      dataset,
      rawText: item.content,
      createCollectionParams: {
        teamId: dataset.teamId,
        tmbId: dataset.tmbId,
        datasetId: dataset._id,
        type: DatasetCollectionTypeEnum.link,
        name: item.title || item.url,

        rawLink: item.url,

        imageIndex: chunkSettings?.imageIndex || false,
        autoIndexes: chunkSettings?.autoIndexes || false,
        trainingType: chunkSettings?.trainingType || DatasetCollectionDataProcessModeEnum.chunk,
        chunkSettingMode: chunkSettings?.chunkSettingMode || ChunkSettingModeEnum.auto,
        chunkSplitMode: chunkSettings?.chunkSplitMode || DataChunkSplitModeEnum.size,
        chunkSize: chunkSettings?.chunkSize || 1024,
        indexSize: chunkSettings?.indexSize || 512,
        chunkSplitter: chunkSettings?.chunkSplitter || undefined,
        qaPrompt: chunkSettings?.qaPrompt || undefined,

        metadata: {
          webPageSelector: dataset.websiteConfig?.selector?.trim() || ''
        }
      }
    });
  };

  const { datasetId } = job.data;

  const dataset = await MongoDataset.findById(datasetId);

  if (!dataset?.websiteConfig?.url) {
    removeWebsiteSyncJobScheduler(datasetId);
    // Skip processing if the dataset has no website configuration
    throw new UnrecoverableError('Dataset has no website configuration');
  }

  const teamId = dataset.teamId.toString();

  // 1. find all existing links
  const linkMap = new Map<string, DatasetCollectionSchemaType>();
  const links = await MongoDatasetCollection.find({
    teamId,
    datasetId,
    type: DatasetCollectionTypeEnum.link
  });

  links.forEach((link) => {
    if (link.rawLink) {
      linkMap.set(`${link.rawLink}-${link.hashRawText}`, link);
    }
  });

  // 2. crawl all website
  const crawl = dynamic ? crawlDynamicWebsite : crawlWebsite;
  await crawl({
    uid: datasetId,
    url: dataset.websiteConfig!.url.trim(),
    maxPage: maxCrawlPage,
    selector: dataset.websiteConfig!.selector?.trim() || 'body',
    crawlOnePageCallback: async (item, stopCrawler) => {
      // Check dataset is deleted
      const dataset = await MongoDataset.findById(datasetId);
      if (!dataset) {
        await removeWebsiteSyncJobScheduler(datasetId);
        stopCrawler();
        return Promise.reject('Dataset is deleted');
      }

      try {
        const key = `${item.url}-${hashStr(item.content)}`;
        const oldLink = linkMap.get(key);
        await retryFn(async () => {
          if (!oldLink) {
            // not exist
            await createCollectionAndPushData({
              dataset,
              item
            });
          } else {
            // exist
            linkMap.delete(key);
            if (oldLink.name !== item.title) {
              // update title
              MongoDatasetCollection.updateOne(
                { _id: oldLink._id },
                { $set: { name: item.title } }
              );
            }
          }
        });
      } catch (error) {}
    }
  });

  // 3. delete outdated links
  const collections: DatasetCollectionSchemaType[] = Array.from(linkMap.values());
  await mongoSessionRun(async (session) => {
    await delCollection({ collections, session, delImg: true, delFile: true });
  });
};
