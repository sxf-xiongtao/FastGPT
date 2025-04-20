import { NextAPI } from '@/service/middleware/entry';
import { adminCert } from '@/service/support/permission/adminCert';
import { ApiRequestProps } from '@fastgpt/service/type/next';
import { NextApiResponse } from 'next';
import { GetDataChartsQuery } from './type';
import { MongoUsage } from '@fastgpt/service/support/wallet/usage/schema';
import { getMongoTimezoneCode } from '@fastgpt/global/common/time/timezone';

export type GetPointUsagesResponse = {
  date: Date;
  count: number;
}[];

async function handler(
  req: ApiRequestProps<{}, GetDataChartsQuery>,
  res: NextApiResponse
): Promise<GetPointUsagesResponse> {
  await adminCert({ req, authToken: true });
  const startTime = req.query.startTime;

  const data = await MongoUsage.aggregate([
    { $match: { time: { $gte: new Date(startTime) } } },
    {
      $addFields: {
        localTime: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$time',
            timezone: getMongoTimezoneCode(startTime)
          }
        }
      }
    },
    {
      $group: {
        _id: '$localTime',
        count: { $sum: '$totalPoints' }
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

  return data;
}

export default NextAPI(handler);
