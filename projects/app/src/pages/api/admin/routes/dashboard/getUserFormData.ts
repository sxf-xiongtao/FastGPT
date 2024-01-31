import { connectToDatabase } from '@/service/mongo';
import { adminCert } from '@/service/support/permission/adminCert';
import { jsonRes } from '@fastgpt/service/common/response';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { addDays } from 'date-fns';
import { NextApiRequest, NextApiResponse } from 'next';

const day = 60;

export default async function getUserFormData(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    await adminCert({ req, authToken: true });

    let startCount = await MongoUser.countDocuments({
      createTime: { $lt: addDays(new Date(), -60) }
    });
    const usersRaw = await MongoUser.aggregate([
      { $match: { createTime: { $gte: addDays(new Date(), -60) } } },
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

    const userCount = usersRaw.map((item) => {
      const increaseRate = `${((item.count / startCount) * 100).toFixed(2)}%`;
      startCount += item.count;
      return {
        date: item.date,
        count: startCount,
        increase: item.count,
        increaseRate
      };
    });

    const currentDate = new Date();
    const expectedDates = [];
    if (startCount > 0) {
      for (let i = day; i >= 0; i--) {
        const date = new Date(currentDate);
        date.setDate(currentDate.getDate() - i);
        date.setUTCHours(0, 0, 0, 0);
        expectedDates.push(date);
      }
    } else {
      for (let i = day; i >= 0; i--) {
        const date = new Date(currentDate);
        date.setDate(currentDate.getDate() - i);
        date.setUTCHours(0, 0, 0, 0);
        if (usersRaw[0].date.getTime() > date.getTime()) break;
        expectedDates.push(date);
      }
    }

    const countResult = expectedDates.map((date) => {
      const existingValue = userCount.find(
        (item) => new Date(item.date).getTime() === date.getTime()
      );
      if (existingValue) {
        return existingValue;
      } else {
        const emptyValue = {
          date: date.toISOString(),
          count: userCount.length > 0 ? userCount[0].count : 0,
          increase: 0,
          increaseRate: '0.00%'
        };

        userCount
          .filter((item) => new Date(item.date).getTime() < date.getTime())
          .forEach((item) => {
            emptyValue.count = item.count;
          });

        return emptyValue;
      }
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
