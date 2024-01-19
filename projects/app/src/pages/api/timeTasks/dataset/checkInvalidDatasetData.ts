import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { addLog } from '@fastgpt/service/common/system/log';
import { addHours } from 'date-fns';
import { MongoDatasetData } from '@fastgpt/service/core/dataset/data/schema';
import { checkVectorDataExist } from '@fastgpt/service/common/vectorStore/controller';

/* 
  检测无效的mongo dataset.datas

  可能异常情况：
  1. 向量删除了，mongo没删除
  2. 向量更新了，mongo没更新
*/

let deleteDataAmount = 0;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { startHour = 5, endHour = 1 } = req.body as {
      startHour?: number;
      endHour?: number;
    };
    await authCert({ req, authRoot: true });
    await connectToDatabase();

    // start: now - maxDay, end: now - 3 day
    const start = addHours(new Date(), -startHour);
    const end = addHours(new Date(), -endHour);
    deleteDataAmount = 0;

    await checkInvalidData(start, end);

    jsonRes(res, {
      data: deleteDataAmount,
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

export async function checkInvalidData(start: Date, end: Date) {
  const dataList = await MongoDatasetData.find(
    {
      updateTime: {
        $gte: start,
        $lte: end
      }
    },
    '_id teamId indexes'
  );
  console.log('total dataset data', dataList.length);

  let index = 0;

  for await (const data of dataList) {
    try {
      // 2. find dataset.data
      const checkResults = (
        await Promise.all(
          data.indexes.map(async (item, index) => {
            return {
              data,
              index,
              exist: await checkVectorDataExist(item.dataId)
            };
          })
        )
      ).filter((item) => !item.exist);

      // 3. if not found, delete mongo data indexes. if indexes.length === 1, delete data
      for (const item of checkResults) {
        if (item.exist) continue;
        try {
          if (item.data.indexes.length === 1) {
            await item.data.deleteOne();
          } else {
            item.data.indexes.splice(item.index, 1);
            await item.data.save();
          }
          deleteDataAmount++;
          console.log('invalid mongo data', item.data._id);
        } catch (error) {}
      }

      index++;
      index % 100 === 0 && console.log(index);
    } catch (error) {
      console.log(error);
    }
  }
  console.log(`检测完成，共有 ${deleteDataAmount} 个无效数据`);
}
