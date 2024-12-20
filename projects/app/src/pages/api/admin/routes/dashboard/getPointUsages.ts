import { getDashboardDataStartTime } from '@/service/admin/common/dashboard/utils';
import { NextAPI } from '@/service/middleware/entry';
import { adminCert } from '@/service/support/permission/adminCert';
import { ApiRequestProps } from '@fastgpt/service/type/next';
import { NextApiResponse } from 'next';
import { GetDataChartsQuery } from './type';
import { MongoUsage } from '@fastgpt/service/support/wallet/usage/schema';

export type GetPointUsagesResponse = {
  date: Date;
  count: number;
}[];

async function handler(
  req: ApiRequestProps<{}, GetDataChartsQuery>,
  res: NextApiResponse
): Promise<GetPointUsagesResponse> {
  await adminCert({ req, authToken: true });
  const day = Number(req.query.day);

  const data = await MongoUsage.aggregate([
    { $match: { time: { $gte: getDashboardDataStartTime(day) } } },
    {
      $group: {
        _id: {
          year: { $year: '$time' },
          month: { $month: '$time' },
          day: { $dayOfMonth: '$time' }
        },
        // 添加 totalPoints 的统计
        count: { $sum: '$totalPoints' }
      }
    },
    {
      $project: {
        _id: 0,
        date: { $dateFromParts: { year: '$_id.year', month: '$_id.month', day: '$_id.day' } },
        count: 1
      }
    },
    { $sort: { date: 1 } }
  ]);

  return data;
}

export default NextAPI(handler);
