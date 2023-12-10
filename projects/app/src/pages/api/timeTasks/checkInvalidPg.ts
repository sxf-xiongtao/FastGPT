import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { addLog } from '@fastgpt/service/common/system/log';
import { PgClient } from '@fastgpt/service/common/pg';
import { PgDatasetTableName } from '@fastgpt/global/core/dataset/constant';
import { addDays } from 'date-fns';
import dayjs from 'dayjs';
import { MongoDatasetData } from '@fastgpt/service/core/dataset/data/schema';
import { delay } from '@fastgpt/global/common/system/utils';

/* 
  检测无效的 PG 数据. 创建数据的流程：
  1. 先插入 pg
  2. 再插入 mongo

  异常情况：
  1. 插入 pg 成功，但是插入 mongo 失败，导致 pg 里有数据，mongo 里没有数据。需要删除 pg 中存在，但是 mongo 中不存在的数据
  2. 删除不干净 （这个新版不会产生）

  1. 拿到 pg 的 collection_id 和 data_id
  2. 去 Mongo 中找对应集合中是否有该 data_id，没有的话则删除（不需要关心 indexes 里是否有）
*/

let deletedPgAmount = 0;
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
    deletedPgAmount = 0;

    await checkInvalidPg(start, end, limit);

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

export async function checkInvalidPg(start: Date, end: Date, limit = 50) {
  // 1. get all pg data
  const { rows } = await PgClient.query<{ id: string; data_id: string }>(`SELECT id, data_id
  FROM ${PgDatasetTableName}
  WHERE createTime BETWEEN '${dayjs(start).format('YYYY-MM-DD')}' AND '${dayjs(end).format(
    'YYYY-MM-DD 23:59:59'
  )}';
  `);
  console.log('total data', rows.length);

  for (let i = 0; i < limit; i++) {
    check(i);
  }

  async function check(index: number, retry = 3): Promise<any> {
    const item = rows[index];
    if (!item) {
      console.log(`检测完成，共删除 ${deletedPgAmount} 个无效文件`);

      return;
    }
    try {
      // 2. find dataset.data
      const hasData = await MongoDatasetData.countDocuments({ _id: item.data_id });

      // 3. if not found, delete pg
      if (hasData === 0) {
        await PgClient.delete(PgDatasetTableName, {
          where: [['id', item.id]]
        });
        console.log('delete pg', item.id);
        deletedPgAmount++;
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
