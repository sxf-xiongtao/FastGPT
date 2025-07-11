import type { Job } from '@fastgpt/service/common/bullmq';
import { UnrecoverableError } from '@fastgpt/service/common/bullmq';
import { type CrawlDataItemType } from '@/service/common/crawler';
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
import { RootCollectionId } from '@fastgpt/global/core/dataset/collection/constants';
import { MongoDataset } from '@fastgpt/service/core/dataset/schema';
import {
  createCollectionAndInsertData,
  delCollection
} from '@fastgpt/service/core/dataset/collection/controller';
import { hashStr } from '@fastgpt/global/common/string/tools';
import { MongoDatasetCollection } from '@fastgpt/service/core/dataset/collection/schema';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import { addLog } from '@fastgpt/service/common/system/log';
import {
  getDatasetSyncWorker,
  removeDatasetSyncJobScheduler,
  type DatasetSyncJobData
} from '@fastgpt/service/core/dataset/datasetSync';
import { getApiDatasetRequest } from '@fastgpt/service/core/dataset/apiDataset';
import type { APIFileItemType } from '@fastgpt/global/core/dataset/apiDataset/type';
import { syncCollection } from '@fastgpt/service/core/dataset/collection/utils';
import { DatasetTypeEnum } from '@fastgpt/global/core/dataset/constants';
import { crawlDynamicWebsite } from '@/service/common/crawler/crawlDynamicWebsite';
import { crawlWebsite } from '@/service/common/crawler';

export const initDatasetSyncWorker = () => {
  addLog.info('Init DatasetSync Worker...');
  return getDatasetSyncWorker(SyncProcessor);
};

const SyncProcessor = async (job: Job<DatasetSyncJobData>) => {
  const { datasetId } = job.data;
  const dataset = await MongoDataset.findById(datasetId);

  if (!dataset) {
    throw new UnrecoverableError('Dataset not found');
  }

  addLog.info('Sync dataset', { datasetId, type: dataset.type });

  if (
    dataset.type === DatasetTypeEnum.apiDataset ||
    dataset.type === DatasetTypeEnum.feishu ||
    dataset.type === DatasetTypeEnum.yuque
  ) {
    return apiDatasetProcessor(dataset);
  } else if (dataset.type === DatasetTypeEnum.websiteDataset) {
    return websiteProcessor(dataset);
  } else {
    return commonProcessor(dataset);
  }
};

const commonProcessor = async (dataset: DatasetSchemaType) => {
  const allCollections = await MongoDatasetCollection.find({
    teamId: dataset.teamId,
    datasetId: dataset._id,
    type: { $in: [DatasetCollectionTypeEnum.link] }
  }).lean();

  for (const collection of allCollections) {
    try {
      await syncCollection({
        ...collection,
        dataset
      });
    } catch (error) {
      addLog.warn('Sync collection error', { datasetId: dataset._id, error });
    }
  }
};

const apiDatasetProcessor = async (dataset: DatasetSchemaType) => {
  let isRoot = false;

  // Check if dataset has API configuration
  if (!dataset.apiDatasetServer) {
    throw new UnrecoverableError('Dataset has no API configuration');
  }

  // 1. find all existing links
  const apiFileMap = new Map<string, DatasetCollectionSchemaType>();
  const importByFolderMap = new Map<string, DatasetCollectionSchemaType>();
  const updateQueue = new Map<string, any>();
  const newFileQueue = new Map<string, any>();

  const updateCollection = async (
    file: APIFileItemType,
    collection: DatasetCollectionSchemaType
  ) => {
    if (collection.type === 'apiFile') {
      const result = await syncCollection({
        ...collection,
        dataset
      });
    } else if (collection.type === 'folder') {
      if (collection.name !== file.name) {
        await MongoDatasetCollection.updateOne(
          {
            _id: collection?._id
          },
          {
            $set: {
              name: file.name
            }
          }
        );
      }
    }
  };

  const allCollections = await MongoDatasetCollection.find({
    teamId: dataset.teamId,
    datasetId: dataset._id
  }).lean();

  // Process collections sequentially to ensure proper async handling
  const apiDatasetRequest = await getApiDatasetRequest(dataset.apiDatasetServer);

  for (const collection of allCollections) {
    if (collection.apiFileId === RootCollectionId) {
      isRoot = true;
    }
    if (collection.apiFileParentId) {
      importByFolderMap.set(apiDatasetRequest.getFileRawId(collection.apiFileId || ''), collection);
    } else if (collection.apiFileId !== RootCollectionId) {
      apiFileMap.set(apiDatasetRequest.getFileRawId(collection.apiFileId || ''), collection);
    }
  }

  // 2. find all dataset
  const getFile = async (fileId: string | null, apiFileParentId: string | null) => {
    const files: APIFileItemType[] = await apiDatasetRequest.listFiles({
      parentId: fileId
    });

    for (const item of files) {
      if (!apiFileParentId) {
        const match = apiFileMap.get(item.rawId);
        if (match) {
          updateQueue.set(item.id, {
            file: item,
            collection: apiFileMap.get(item.rawId),
            apiFileParentId: null
          });
          apiFileMap.delete(item.rawId);
        }
        if (item.hasChild) {
          await getFile(item.id, match ? item.id : null);
        }
      } else {
        if (importByFolderMap.has(item.rawId)) {
          updateQueue.set(item.id, {
            file: item,
            collection: importByFolderMap.get(item.rawId),
            apiFileParentId: apiFileParentId
          });
          importByFolderMap.delete(item.rawId);
        } else {
          newFileQueue.set(item.rawId, {
            file: item,
            collection: null,
            apiFileParentId: apiFileParentId
          });
        }
        if (item.hasChild) {
          await getFile(item.id, apiFileParentId);
        }
      }
    }
  };

  if (isRoot) {
    await getFile(null, RootCollectionId);
  } else {
    await getFile(null, null);
  }

  // 3. update and create
  for (const [id, item] of updateQueue) {
    await updateCollection(item.file, item.collection);
  }

  for (const [id, item] of newFileQueue) {
    const file = item.file;
    if (file.type === 'file') {
      const content = await apiDatasetRequest.getFileContent({
        apiFileId: file.id,
        teamId: dataset.teamId,
        tmbId: dataset.tmbId
      });

      await createCollectionAndInsertData({
        dataset,
        rawText: content.rawText,
        createCollectionParams: {
          teamId: dataset.teamId,
          tmbId: dataset.tmbId,
          datasetId: dataset._id,
          type: DatasetCollectionTypeEnum.apiFile,
          name: content.title,
          apiFileId: file.id,
          ...(item.apiFileParentId && { apiFileParentId: item.apiFileParentId }),
          hashRawText: hashStr(content.rawText),

          imageIndex: dataset.chunkSettings?.imageIndex || false,
          autoIndexes: dataset.chunkSettings?.autoIndexes || false,
          trainingType:
            dataset.chunkSettings?.trainingType || DatasetCollectionDataProcessModeEnum.chunk,
          chunkSettingMode: dataset.chunkSettings?.chunkSettingMode || ChunkSettingModeEnum.auto,
          chunkSplitMode: dataset.chunkSettings?.chunkSplitMode || DataChunkSplitModeEnum.size,
          chunkSize: dataset.chunkSettings?.chunkSize || 1024,
          indexSize: dataset.chunkSettings?.indexSize || 512,
          chunkSplitter: dataset.chunkSettings?.chunkSplitter || undefined,
          qaPrompt: dataset.chunkSettings?.qaPrompt || undefined
        }
      });
    }
  }

  // 3. delete outdated links
  const collections: DatasetCollectionSchemaType[] = Array.from(apiFileMap.values()).concat(
    Array.from(importByFolderMap.values())
  );
  await mongoSessionRun(async (session) => {
    await delCollection({ collections, session, delImg: true, delFile: true });
  });
};

const websiteProcessor = async (dataset: DatasetSchemaType) => {
  // config
  const maxCrawlPage = process.env.MAX_CRAWL_PAGE ? parseInt(process.env.MAX_CRAWL_PAGE) : 200;
  const dynamic = process.env.CRAWL_DYNAMIC_WEBSITE === 'true';

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

  if (!dataset?.websiteConfig?.url) {
    removeDatasetSyncJobScheduler(dataset._id);
    // Skip processing if the dataset has no website configuration
    throw new UnrecoverableError('Dataset has no website configuration');
  }

  const datasetId = dataset._id.toString();
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
        await removeDatasetSyncJobScheduler(datasetId);
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
