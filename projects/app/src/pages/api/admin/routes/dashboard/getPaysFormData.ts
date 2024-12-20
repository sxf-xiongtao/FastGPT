import { adminCert } from '@/service/support/permission/adminCert';
import { MongoBill } from '@/service/support/wallet/bill/schema';
import { NextApiResponse } from 'next';
import { getDashboardDataStartTime } from '@/service/admin/common/dashboard/utils';
import { NextAPI } from '@/service/middleware/entry';
import { GetDataChartsQuery } from './type';
import { ApiRequestProps } from '@fastgpt/service/type/next';

export type GetPaysFormDataResponse = {
  date: Date;
  count: number;
  total: number;
}[];

async function handler(
  req: ApiRequestProps<{}, GetDataChartsQuery>,
  res: NextApiResponse
): Promise<GetPaysFormDataResponse> {
  await adminCert({ req, authToken: true });
  const day = Number(req.query.day);

  let startCount = 0;

  const paysRaw = await MongoBill.aggregate([
    {
      $match: {
        status: 'SUCCESS',
        'metadata.payWay': 'wx',
        createTime: {
          $gte: getDashboardDataStartTime(day)
        }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createTime' },
          month: { $month: '$createTime' },
          day: { $dayOfMonth: '$createTime' }
        },
        count: { $sum: '$price' }
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

  const countResult = paysRaw.map((item) => {
    startCount += item.count;
    return {
      date: item.date,
      total: startCount,
      count: item.count
    };
  });

  return countResult;
}

export default NextAPI(handler);
