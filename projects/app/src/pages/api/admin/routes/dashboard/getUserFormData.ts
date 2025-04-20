import { getDashboardDataStartTime } from '@/service/admin/common/dashboard/utils';
import { NextAPI } from '@/service/middleware/entry';
import { adminCert } from '@/service/support/permission/adminCert';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { NextApiResponse } from 'next';
import { GetDataChartsQuery } from './type';
import { ApiRequestProps } from '@fastgpt/service/type/next';
import { getMongoTimezoneCode } from '@fastgpt/global/common/time/timezone';
import dayjs from 'dayjs';

export type GetUserFormDataResponse = {
  date: Date;
  count: number;
  increase: number;
}[];

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
  let startCount = await MongoUser.countDocuments({
    createTime: { $lt: new Date(startTime) }
  });

  const formatResults = usersRaw.map((item) => {
    startCount += item.count;
    return {
      date: item.date,
      count: startCount,
      increase: item.count
    };
  });

  return formatResults;
}

export default NextAPI(handler);
