import { connectToDatabase } from '@/service/mongo';
import { adminCert } from '@/service/support/permission/adminCert';
import { NextApiRequest, NextApiResponse } from 'next';
import { MongoChatItem } from '@fastgpt/service/core/chat/chatItemSchema';
import { jsonRes } from '@fastgpt/service/common/response';

const day = 60;

export default async function getChatFormData(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    await adminCert({ req, authToken: true });

    let startCount = await MongoChatItem.countDocuments({
      time: { $lt: new Date(Date.now() - day * 24 * 60 * 60 * 1000) }
    });
    const chatsRaw = await MongoChatItem.aggregate([
      { $match: { time: { $gte: new Date(Date.now() - day * 24 * 60 * 60 * 1000) } } },
      {
        $group: {
          _id: {
            year: { $year: '$time' },
            month: { $month: '$time' },
            day: { $dayOfMonth: '$time' }
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

    const chatCount = chatsRaw.map((item) => {
      startCount += item.count;
      return {
        date: item.date,
        count: startCount,
        increase: item.count
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
        if (chatsRaw[0].date.getTime() > date.getTime()) break;
        expectedDates.push(date);
      }
    }

    const countResult = expectedDates.map((date) => {
      const existingValue = chatCount.find(
        (item) => new Date(item.date).getTime() === date.getTime()
      );
      if (existingValue) {
        return existingValue;
      } else {
        const emptyValue = {
          date: date.toISOString(),
          count: chatCount.length > 0 ? chatCount[0].count : 0,
          increase: 0
        };

        chatCount
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
