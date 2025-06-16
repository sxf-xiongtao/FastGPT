import { NextAPI } from '@/service/middleware/entry';
import { adminCert } from '@/service/support/permission/adminCert';
import { ApiRequestProps } from '@fastgpt/service/type/next';
import { NextApiResponse } from 'next';
import { GetDataChartsQuery } from './type';
import { MongoUsage } from '@fastgpt/service/support/wallet/usage/schema';
import { getMongoTimezoneCode } from '@fastgpt/global/common/time/timezone';
import { readFromSecondary } from '@fastgpt/service/common/mongo/utils';

export type GetCostChartsResponse = {
  pointUsages: {
    date: string;
    totalCount: number;
  }[];
};

async function handler(
  req: ApiRequestProps<GetDataChartsQuery>,
  res: NextApiResponse
): Promise<GetCostChartsResponse> {
  await adminCert({ req, authToken: true });

  const { startTime, sources } = req.body;

  const data = (await MongoUsage.aggregate(
    [
      {
        $match: {
          ...(sources && { source: { $in: sources } }),
          time: { $gte: new Date(startTime) }
        }
      },
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
          totalCount: { $sum: '$totalPoints' }
        }
      },
      {
        $project: {
          _id: 0,
          date: { $dateFromString: { dateString: '$_id' } },
          totalCount: 1
        }
      },
      { $sort: { date: 1 } }
    ],
    {
      ...readFromSecondary
    }
  )) as unknown as {
    date: string;
    totalCount: number;
  }[];

  return {
    pointUsages: data.map((item) => ({
      date: item.date,
      totalCount: Math.floor(item.totalCount)
    }))
  };
}

export default NextAPI(handler);
