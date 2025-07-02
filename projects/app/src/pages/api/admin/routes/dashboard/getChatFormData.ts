import { adminCert } from '@/service/support/permission/adminCert';
import type { NextApiResponse } from 'next';
import { MongoChatItem } from '@fastgpt/service/core/chat/chatItemSchema';
import { NextAPI } from '@/service/middleware/entry';
import type { ApiRequestProps } from '@fastgpt/service/type/next';
import type { GetDataChartsQuery } from './type';
import { getMongoTimezoneCode } from '@fastgpt/global/common/time/timezone';

export type GetChatFormDataResponse = {
  chatAmounts: {
    date: string;
    totalCount: number;
  }[];
  chatItemAmounts: {
    date: string;
    totalCount: number;
    averageCount: number;
  }[];
};

async function handler(
  req: ApiRequestProps<{}, GetDataChartsQuery>,
  res: NextApiResponse
): Promise<GetChatFormDataResponse> {
  await adminCert({ req, authToken: true });
  const startTime = req.query.startTime;
  const timezone = getMongoTimezoneCode(startTime);

  const chatItemsRaw = (await MongoChatItem.aggregate([
    {
      $match: {
        obj: 'Human',
        time: { $gte: new Date(startTime) }
      }
    },
    {
      $project: {
        localTime: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$time',
            timezone
          }
        },
        appId: 1,
        chatId: 1
      }
    },
    {
      $group: {
        _id: '$localTime',
        chatItemCount: { $sum: 1 },
        uniqueChats: {
          $addToSet: {
            $cond: {
              if: { $and: [{ $ne: ['$appId', null] }, { $ne: ['$chatId', null] }] },
              then: { $concat: [{ $toString: '$appId' }, '-', '$chatId'] },
              else: null
            }
          }
        }
      }
    },
    {
      $project: {
        _id: 0,
        date: { $dateFromString: { dateString: '$_id' } },
        chatItemCount: 1,
        // 过滤掉 null 值
        chatCount: {
          $size: {
            $filter: {
              input: '$uniqueChats',
              cond: { $ne: ['$$this', null] }
            }
          }
        }
      }
    },
    { $sort: { date: 1 } }
  ])) as unknown as { date: string; chatItemCount: number; chatCount: number }[];

  return {
    chatAmounts: chatItemsRaw.map((item) => ({
      date: item.date,
      totalCount: item.chatCount
    })),
    chatItemAmounts: chatItemsRaw.map((item) => ({
      date: item.date,
      totalCount: item.chatItemCount,
      averageCount: +(item.chatItemCount / item.chatCount).toFixed(2)
    }))
  };
}

export default NextAPI(handler);
