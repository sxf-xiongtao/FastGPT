import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { authDataset } from '@fastgpt/service/support/permission/auth/dataset';
import { crawlWebsite, type CrawlDataItemType } from '@/service/common/crawler';
import { MongoDatasetCollection } from '@fastgpt/service/core/dataset/collection/schema';
import { splitText2Chunks } from '@fastgpt/global/common/string/textSplitter';
import { MongoDatasetTraining } from '@fastgpt/service/core/dataset/training/schema';
import {
  DatasetCollectionTrainingModeEnum,
  DatasetCollectionTypeEnum,
  DatasetStatusEnum,
  TrainingModeEnum
} from '@fastgpt/global/core/dataset/constant';
import { MongoBill } from '@fastgpt/service/support/wallet/bill/schema';
import { BillSourceEnum } from '@fastgpt/global/support/wallet/bill/constants';
import { delay } from '@/utils/tools';
import { DatasetSchemaType } from '@fastgpt/global/core/dataset/type';
import { MongoDataset } from '@fastgpt/service/core/dataset/schema';

// config
const maxCrawlPage = 200;
const chunkSize = 768;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { datasetId } = req.body as { datasetId: string };
  try {
    await connectToDatabase();
    const { dataset } = await authDataset({
      datasetId,
      req,
      authToken: true
    });

    if (!dataset?.websiteConfig?.url) {
      throw new Error('Dataset is not website dataset');
    }

    // 1. delete parentId = collection._id collections
    await MongoDatasetCollection.deleteMany({ datasetId: dataset._id });

    // 2. create bill
    const { _id: billId } = await MongoBill.create({
      teamId: dataset.teamId,
      tmbId: dataset.tmbId,
      appName: 'core.dataset.training.Website Sync',
      source: BillSourceEnum.training,
      list: [
        {
          moduleName: '索引生成',
          model: dataset.vectorModel,
          amount: 0,
          tokenLen: 0
        },
        {
          moduleName: 'QA 拆分',
          model: dataset.agentModel,
          amount: 0,
          tokenLen: 0
        }
      ],
      total: 0
    });

    // 3. crawl all website
    await crawlWebsite({
      url: dataset.websiteConfig.url.trim(),
      maxPage: maxCrawlPage,
      selector: dataset.websiteConfig?.selector?.trim() || 'body',
      crawlOnePageCallback: (item) =>
        createCollectionAndPushData({
          dataset,
          item,
          billId,
          retry: 3
        })
    });

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

async function createCollectionAndPushData(props: {
  dataset: DatasetSchemaType;
  item: CrawlDataItemType;
  billId: string;
  retry: number;
}): Promise<any> {
  const { dataset, item, billId, retry } = props;

  try {
    // 1. split text to chunks
    const { chunks } = splitText2Chunks({
      text: item.content,
      chunkLen: chunkSize
    });

    // 2. create collection
    const { _id: collectionId } = await MongoDatasetCollection.create({
      parentId: null,
      teamId: dataset.teamId,
      tmbId: dataset.tmbId,
      datasetId: dataset._id,
      type: DatasetCollectionTypeEnum.link,
      name: item.url,
      trainingType: DatasetCollectionTrainingModeEnum.chunk,
      chunkSize,
      rawLink: item.url
    });

    // 3. push data to training queue
    await MongoDatasetTraining.insertMany(
      chunks.map((item, i) => ({
        teamId: dataset.teamId,
        tmbId: dataset.tmbId,
        datasetId: dataset._id,
        collectionId,
        billId,
        mode: TrainingModeEnum.chunk,
        prompt: '',
        model: dataset.vectorModel,
        q: item,
        a: '',
        chunkIndex: i
      }))
    );
  } catch (err) {
    await delay(1000);
    if (retry > 0) {
      return createCollectionAndPushData({
        ...props,
        retry: retry - 1
      });
    }
    return Promise.reject(err);
  }
}

async function updateStatusToActive(datasetId: string) {
  try {
    await MongoDataset.findByIdAndUpdate(datasetId, {
      status: DatasetStatusEnum.active
    });
  } catch (error) {
    await delay(2000);
    return updateStatusToActive(datasetId);
  }
}
