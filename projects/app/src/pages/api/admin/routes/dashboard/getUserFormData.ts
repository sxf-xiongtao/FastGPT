import { connectToDatabase } from '@/service/mongo';
import { adminCert } from '@/service/support/permission/adminCert';
import { jsonRes } from '@fastgpt/service/common/response';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { NextApiRequest, NextApiResponse } from 'next';

const day = 60;

export default async function getUserFormData(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    await adminCert({ req, authToken: true });

    let startCount = await MongoUser.countDocuments({
      createTime: { $lt: new Date(Date.now() - day * 24 * 60 * 60 * 1000) }
    });
    const usersRaw = await MongoUser.aggregate([
      { $match: { createTime: { $gte: new Date(Date.now() - day * 24 * 60 * 60 * 1000) } } },
      {
        $group: {
          _id: {
            year: { $year: '$createTime' },
            month: { $month: '$createTime' },
            day: { $dayOfMonth: '$createTime' }
          },
          count: { $sum: 1 }
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

    const countResult = usersRaw.map((item) => {
      const increaseRate = `${((item.count / startCount) * 100).toFixed(2)}%`;
      startCount += item.count;
      return {
        date: item.date,
        count: startCount,
        increase: item.count,
        increaseRate
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
