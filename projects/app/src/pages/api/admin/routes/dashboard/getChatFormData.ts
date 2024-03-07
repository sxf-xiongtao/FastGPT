import { connectToDatabase } from '@/service/mongo';
import { adminCert } from '@/service/support/permission/adminCert';
import { NextApiRequest, NextApiResponse } from 'next';
import { MongoChatItem } from '@fastgpt/service/core/chat/chatItemSchema';
import { jsonRes } from '@fastgpt/service/common/response';
import { getDashboardDataStartTime } from '@/service/admin/common/dashboard/utils';

export default async function getChatFormData(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    await adminCert({ req, authToken: true });

    // 获取对话总数
    const chatsRaw = await MongoChatItem.aggregate([
      {
        $match: {
          obj: 'Human',
          time: { $gte: getDashboardDataStartTime() }
        }
      },
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
      return {
        date: item.date,
        count: item.count
      };
    });

    jsonRes(res, {
      data: { countResult: chatCount }
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
