import { connectToDatabase } from '@/service/mongo';
import { adminCert } from '@/service/support/permission/adminCert';
import { MongoPay } from '@/service/support/wallet/pay/schema';
import { jsonRes } from '@fastgpt/service/common/response';
import { addDays } from 'date-fns';
import { NextApiRequest, NextApiResponse } from 'next';

const day = 60;

export default async function getPaysFormData(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    await adminCert({ req, authToken: true });

    let startCount = 0;

    const paysRaw = await MongoPay.aggregate([
      {
        $match: {
          status: 'SUCCESS',
          createTime: {
            $gte: addDays(new Date(), -60)
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

    jsonRes(res, {
      data: {
        countResult
      }
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
