import { adminCert } from '@/service/support/permission/adminCert';
import { NextApiResponse } from 'next';
import { MongoChatItem } from '@fastgpt/service/core/chat/chatItemSchema';
import { NextAPI } from '@/service/middleware/entry';
import { ApiRequestProps } from '@fastgpt/service/type/next';
import { GetDataChartsQuery } from './type';
import { getMongoTimezoneCode } from '@fastgpt/global/common/time/timezone';

export type GetChatFormDataResponse = {
  date: Date;
  count: number;
}[];

async function handler(
  req: ApiRequestProps<{}, GetDataChartsQuery>,
  res: NextApiResponse
): Promise<GetChatFormDataResponse> {
  await adminCert({ req, authToken: true });
  const startTime = req.query.startTime;

  // 获取对话总数
  const chatsRaw = await MongoChatItem.aggregate([
    {
      $match: {
        obj: 'Human',
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
        count: { $sum: 1 }
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

  const chatCount = chatsRaw.map((item) => {
    return {
      date: item.date,
      count: item.count
    };
  });

  return chatCount;
}

export default NextAPI(handler);
