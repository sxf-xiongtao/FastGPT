import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { addLog } from '@fastgpt/service/common/system/log';
import { addDays } from 'date-fns';
import { delay } from '@fastgpt/global/common/system/utils';
import { MongoDatasetCollection } from '@fastgpt/service/core/dataset/collection/schema';
import { MongoDataset } from '@fastgpt/service/core/dataset/schema';
import { MongoDatasetData } from '@fastgpt/service/core/dataset/data/schema';

/* 
  检测无效的mongo dataset.collection

  可能异常情况：
  1. 在训练过程中删除了集合或者知识库。
*/

let deleteCollectionAmount = 0;
let deleteDataAmount = 0;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      startDay = 5,
      endDay = 1,
      limit = 50
    } = req.body as { startDay?: number; endDay?: number; limit: number };
    await authCert({ req, authRoot: true });
    await connectToDatabase();

    // start: now - maxDay, end: now - 3 day
    const start = addDays(new Date(), -startDay);
    const end = addDays(new Date(), -endDay);
    deleteCollectionAmount = 0;
    deleteDataAmount = 0;

    await checkInvalidCollection(start, end, limit);
    await checkInvalidData(start, end, limit);

    jsonRes(res, {
      message: 'success'
    });
  } catch (error) {
    addLog.error(`check Invalid user error`, error);

    jsonRes(res, {
      code: 500,
      error
    });
  }
}

export async function checkInvalidCollection(start: Date, end: Date, limit = 50) {
  const collections = await MongoDatasetCollection.find(
    {
      createTime: {
        $gte: start,
        $lte: end
      }
    },
    '_id datasetId'
  );
  console.log('total collection', collections.length);

  for (let i = 0; i < limit; i++) {
    check(i);
  }

  async function check(index: number, retry = 3): Promise<any> {
    const collection = collections[index];
    if (!collection) {
      console.log(`检测完成，共删除 ${deleteCollectionAmount} 个无效集合`);

      return;
    }
    try {
      // 2. find dataset.data
      const datasetCount = await MongoDataset.countDocuments({ _id: collection.datasetId });

      // 3. if not found, delete pg
      if (datasetCount === 0) {
        await MongoDatasetCollection.findByIdAndDelete(collection._id);
        console.log('delete collection', collection);
        deleteCollectionAmount++;
      }
      index % 100 === 0 && console.log(index);
      return check(index + limit);
    } catch (error) {
      console.log(error);
      if (retry > 0) {
        await delay(2000);
        return check(index, retry - 1);
      }
      return Promise.reject(error);
    }
  }
}

export async function checkInvalidData(start: Date, end: Date, limit = 50) {
  const dataList = await MongoDatasetData.find(
    {
      updateTime: {
        $gte: start,
        $lte: end
      }
    },
    '_id datasetId collectionId'
  );
  console.log('total dataset data', dataList.length);

  for (let i = 0; i < limit; i++) {
    check(i);
  }

  async function check(index: number, retry = 3): Promise<any> {
    const data = dataList[index];
    if (!data) {
      console.log(`检测完成，共删除 ${deleteDataAmount} 个无效数据`);

      return;
    }
    try {
      // 2. find dataset.data
      const [datasetCount, collectionCount] = await Promise.all([
        MongoDataset.countDocuments({ _id: data.datasetId }),
        MongoDatasetCollection.countDocuments({ _id: data.collectionId })
      ]);

      // 3. if not found, delete
      if (datasetCount === 0 || collectionCount === 0) {
        await MongoDatasetData.findByIdAndDelete(data._id);
        console.log('delete data', data);
        deleteDataAmount++;
      }
      index % 100 === 0 && console.log(index);
      return check(index + limit);
    } catch (error) {
      console.log(error);
      if (retry > 0) {
        await delay(2000);
        return check(index, retry - 1);
      }
      return Promise.reject(error);
    }
  }
}
