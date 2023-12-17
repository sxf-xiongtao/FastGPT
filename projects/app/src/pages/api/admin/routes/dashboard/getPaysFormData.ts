import { connectToDatabase } from '@/service/mongo';
import { adminCert } from '@/service/support/permission/adminCert';
import { MongoPay } from '@/service/support/wallet/pay/schema';
import { jsonRes } from '@fastgpt/service/common/response';
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
            $gte: new Date(Date.now() - day * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000) // 补时差
          }
        }
      },
      {
        $addFields: {
          adjustedCreateTime: { $add: ['$createTime', 8 * 60 * 60 * 1000] }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$adjustedCreateTime' },
            month: { $month: '$adjustedCreateTime' },
            day: { $dayOfMonth: '$adjustedCreateTime' }
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
    console.log(countResult);

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
