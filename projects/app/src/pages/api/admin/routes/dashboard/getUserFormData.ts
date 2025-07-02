import { NextAPI } from '@/service/middleware/entry';
import { adminCert } from '@/service/support/permission/adminCert';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import type { NextApiResponse } from 'next';
import type { GetDataChartsQuery } from './type';
import type { ApiRequestProps } from '@fastgpt/service/type/next';
import { getMongoTimezoneCode } from '@fastgpt/global/common/time/timezone';

export type GetUserFormDataResponse = {
  startUserCount: number;
  registeredUserCount: {
    date: string;
    count: number;
  }[];
};

async function handler(
  req: ApiRequestProps<{}, GetDataChartsQuery>,
  res: NextApiResponse
): Promise<GetUserFormDataResponse> {
  await adminCert({ req, authToken: true });

  const startTime = req.query.startTime;

  const usersRaw = await MongoUser.aggregate([
    { $match: { createTime: { $gte: new Date(startTime) } } },
    {
      $addFields: {
        localTime: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$createTime',
            timezone: getMongoTimezoneCode(startTime)
          }
        }
      }
    },
    {
      $group: {
        _id: '$localTime',
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        _id: 0,
        date: { $dateFromString: { dateString: '$_id' } },
        count: 1
      }
    },
    { $sort: { date: 1 } }
  ]);

  // 计算用户总数
  const startUserCount = await MongoUser.countDocuments({
    createTime: { $lt: new Date(startTime) }
  });

  return {
    startUserCount,
    registeredUserCount: usersRaw.map((item) => ({
      date: item.date.toISOString(),
      count: item.count
    }))
  };
}

export default NextAPI(handler);
