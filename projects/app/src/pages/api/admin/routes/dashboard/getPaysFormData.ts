import { adminCert } from '@/service/support/permission/adminCert';
import { MongoBill } from '@/service/support/wallet/bill/schema';
import { NextApiResponse } from 'next';
import { NextAPI } from '@/service/middleware/entry';
import { GetDataChartsQuery } from './type';
import { ApiRequestProps } from '@fastgpt/service/type/next';
import { getMongoTimezoneCode } from '@fastgpt/global/common/time/timezone';

export type GetPaysFormDataResponse = {
  date: Date;
  count: number;
}[];

async function handler(
  req: ApiRequestProps<{}, GetDataChartsQuery>,
  res: NextApiResponse
): Promise<GetPaysFormDataResponse> {
  await adminCert({ req, authToken: true });
  const startTime = req.query.startTime;

  const paysRaw = await MongoBill.aggregate([
    {
      $match: {
        status: 'SUCCESS',
        'metadata.payWay': 'wx',
        createTime: {
          $gte: new Date(startTime)
        }
      }
    },
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
        count: { $sum: '$price' }
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

  const countResult = paysRaw.map((item) => {
    return {
      date: item.date,
      count: item.count
    };
  });

  return countResult;
}

export default NextAPI(handler);
