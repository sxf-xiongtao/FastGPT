import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { addLog } from '@fastgpt/service/common/system/log';
import {
  deleteDatasetDataVector,
  getVectorDataByTime
} from '@fastgpt/service/common/vectorStore/controller';
import { addDays } from 'date-fns';
import { MongoDatasetData } from '@fastgpt/service/core/dataset/data/schema';
import { delay } from '@fastgpt/global/common/system/utils';

/* 
  检测无效的 Vector 数据. 创建数据的流程：
  1. 先插入 vector
  2. 再插入 mongo

  异常情况：
  1. 插入 vector 成功，但是插入 mongo 失败，导致 vector 里有数据，mongo 里没有数据。需要删除 vector 中存在，但是 mongo 中不存在的数据
  2. 删除不干净 （这个新版不会产生）

  1. 拿到 vector 的 collection_id 和 data_id
  2. 去 Mongo 中找对应集合中是否有该 data_id，没有的话则删除（不需要关心 indexes 里是否有）
*/

let deletedVectorAmount = 0;
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
    deletedVectorAmount = 0;

    await checkInvalidVector(start, end, limit);

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

export async function checkInvalidVector(start: Date, end: Date, limit = 50) {
  // 1. get all vector data
  const rows = await getVectorDataByTime(start, end);
  console.log('total data', rows.length);

  for (let i = 0; i < limit; i++) {
    check(i);
  }

  async function check(index: number, retry = 3): Promise<any> {
    const item = rows[index];
    if (!item) {
      console.log(`检测完成，共删除 ${deletedVectorAmount} 个无效 vector 数据`);

      return;
    }
    try {
      // 2. find dataset.data
      const hasData = await MongoDatasetData.countDocuments({ _id: item.dataId });

      // 3. if not found, delete vector
      if (hasData === 0) {
        await deleteDatasetDataVector({
          id: item.id
        });
        console.log('delete vector data', item.id);
        deletedVectorAmount++;
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
