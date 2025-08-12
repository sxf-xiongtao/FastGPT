import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { authApp } from '@fastgpt/service/support/permission/app/auth';
import { Types } from 'mongoose';
import { readFromSecondary } from '@fastgpt/service/common/mongo/utils';
import { MongoAppChatLog } from '@fastgpt/service/core/app/logs/chatLogsSchema';
import { ChatSourceEnum } from '@fastgpt/global/core/chat/constants';
import { getUserDetail } from '@fastgpt/service/support/user/controller';
import type { AppChatLogSchema } from '@fastgpt/global/core/app/logs/type';
import { AppLogTimespanEnum } from '@fastgpt/global/core/app/logs/constants';
import { calculateOffsetDates } from '@fastgpt/global/core/app/logs/utils';
import type { getChartDataBody, getChartDataResponse } from '@fastgpt/global/core/app/logs/api';
import { AppReadChatLogPerVal } from '@fastgpt/global/support/permission/app/constant';

const getFirstDayTimestamp = (
  date: Date,
  timespan: AppLogTimespanEnum,
  timezone: string
): number => {
  const localDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
  const year = localDate.getFullYear();
  const month = localDate.getMonth();
  const day = localDate.getDate();

  switch (timespan) {
    case AppLogTimespanEnum.week: {
      const dayOfWeek = localDate.getDay();
      const monday = new Date(year, month, day - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
      monday.setHours(0, 0, 0, 0);
      return monday.getTime();
    }
    case AppLogTimespanEnum.month:
      return new Date(year, month, 1).getTime();
    case AppLogTimespanEnum.quarter:
      return new Date(year, Math.floor(month / 3) * 3, 1).getTime();
    default:
      return new Date(year, month, day).getTime();
  }
};

const initializeSourceCountMap = (): Record<ChatSourceEnum, number> =>
  Object.values(ChatSourceEnum).reduce(
    (acc, source) => ({ ...acc, [source]: 0 }),
    {} as Record<ChatSourceEnum, number>
  );

async function handler(
  req: ApiRequestProps<getChartDataBody, {}>,
  res: ApiResponseType<any>
): Promise<getChartDataResponse> {
  const {
    appId,
    dateStart: dateStartStr,
    dateEnd: dateEndStr,
    offset = 1,
    source,
    userTimespan,
    chatTimespan,
    appTimespan
  } = req.body;

  const dateStart = new Date(dateStartStr);
  const dateEnd = new Date(dateEndStr);

  const { teamId, tmbId } = await authApp({
    req,
    authToken: true,
    appId,
    per: AppReadChatLogPerVal
  });

  const userDetail = await getUserDetail({ tmbId });
  const timezone = userDetail.timezone || 'UTC';

  const { offsetStart, offsetEnd } = calculateOffsetDates(dateStart, dateEnd, offset, userTimespan);

  const [basicAppChatLogData, currentNewUsers, futureActiveUsers] = await Promise.all([
    MongoAppChatLog.aggregate(
      [
        {
          $match: {
            teamId: new Types.ObjectId(teamId),
            appId: new Types.ObjectId(appId),
            source: source && source.length > 0 ? { $in: source } : { $exists: true },
            updateTime: {
              $gte: dateStart,
              $lte: dateEnd
            }
          }
        },
        {
          $project: {
            updateTime: 1,
            userId: 1,
            isFirstChat: 1,
            chatItemCount: 1,
            errorCount: 1,
            totalPoints: 1,
            goodFeedbackCount: 1,
            badFeedbackCount: 1,
            totalResponseTime: 1,
            source: 1
          }
        }
      ],
      readFromSecondary
    ),
    MongoAppChatLog.aggregate(
      [
        {
          $match: {
            teamId: new Types.ObjectId(teamId),
            appId: new Types.ObjectId(appId),
            source: source && source.length > 0 ? { $in: source } : { $exists: true },
            createTime: { $gte: dateStart, $lte: dateEnd },
            isFirstChat: true
          }
        },
        {
          $project: {
            userId: 1,
            dateTimestamp: {
              $subtract: [
                { $toLong: '$createTime' },
                {
                  $mod: [{ $toLong: '$createTime' }, 86400000]
                }
              ]
            }
          }
        },
        {
          $group: {
            _id: { dateTimestamp: '$dateTimestamp', userId: '$userId' }
          }
        },
        {
          $group: {
            _id: '$_id.dateTimestamp',
            users: { $addToSet: '$_id.userId' }
          }
        },
        {
          $project: {
            dateTimestamp: '$_id',
            users: 1,
            _id: 0
          }
        },
        {
          $sort: { dateTimestamp: 1 }
        }
      ],
      readFromSecondary
    ),
    MongoAppChatLog.aggregate(
      [
        {
          $match: {
            teamId: new Types.ObjectId(teamId),
            appId: new Types.ObjectId(appId),
            source: source && source.length > 0 ? { $in: source } : { $exists: true },
            $or: [
              { createTime: { $gte: offsetStart, $lte: offsetEnd } },
              { updateTime: { $gte: offsetStart, $lte: offsetEnd } }
            ]
          }
        },
        {
          $project: {
            userId: 1,
            activeTimestamp: {
              $subtract: [
                { $toLong: { $max: ['$createTime', '$updateTime'] } },
                {
                  $mod: [{ $toLong: { $max: ['$createTime', '$updateTime'] } }, 86400000]
                }
              ]
            }
          }
        },
        {
          $group: {
            _id: { userId: '$userId' },
            activeTimestamps: { $addToSet: '$activeTimestamp' }
          }
        },
        {
          $project: {
            userId: '$_id.userId',
            activeTimestamps: 1,
            _id: 0
          }
        }
      ],
      readFromSecondary
    )
  ]);

  const { userLogData, chatLogData, appLogData } = formatDataByTimespan({
    rawData: basicAppChatLogData,
    timezone,
    userTimespan,
    chatTimespan,
    appTimespan
  });

  const retentionMap = (() => {
    const newUsersByDate = new Map<number, Set<string>>();
    currentNewUsers.forEach((item: { dateTimestamp: number; users: string[] }) => {
      newUsersByDate.set(item.dateTimestamp, new Set(item.users));
    });

    const activeUserMap = new Map<number, Set<string>>();
    futureActiveUsers.forEach((item: { userId: string; activeTimestamps: number[] }) => {
      item.activeTimestamps.forEach((timestamp: number) => {
        if (!activeUserMap.has(timestamp)) {
          activeUserMap.set(timestamp, new Set());
        }
        activeUserMap.get(timestamp)!.add(item.userId);
      });
    });

    const retentionByTimespan = new Map<string, number>();

    newUsersByDate.forEach((newUsers, dateTimestamp) => {
      const retentionTimestamp = dateTimestamp + offset * 86400000;

      const activeUsers = activeUserMap.get(retentionTimestamp) || new Set();
      const retainedCount = Array.from(newUsers).filter((user) => activeUsers.has(user)).length;

      const timespanKey = getFirstDayTimestamp(new Date(dateTimestamp), userTimespan, timezone);

      retentionByTimespan.set(
        String(timespanKey),
        (retentionByTimespan.get(String(timespanKey)) || 0) + retainedCount
      );
    });

    return retentionByTimespan;
  })();

  const sourceCountMap = (() => {
    const timespanUserSets = new Map<string, Map<ChatSourceEnum, Set<string>>>();
    const validSources = new Set(Object.values(ChatSourceEnum));

    for (const item of basicAppChatLogData) {
      if (!item.source || !item.userId) continue;

      const source = item.source as ChatSourceEnum;
      if (!validSources.has(source)) continue;

      const timestamp = getFirstDayTimestamp(new Date(item.updateTime), appTimespan, timezone);
      const key = timestamp.toString();

      if (!timespanUserSets.has(key)) {
        timespanUserSets.set(key, new Map());
      }

      const sourceSets = timespanUserSets.get(key)!;
      if (!sourceSets.has(source)) {
        sourceSets.set(source, new Set());
      }

      sourceSets.get(source)!.add(item.userId);
    }

    const result = new Map<string, Record<ChatSourceEnum, number>>();
    for (const [key, sourceSets] of timespanUserSets) {
      const sourceCount = initializeSourceCountMap();

      for (const [source, users] of sourceSets) {
        sourceCount[source] = users.size;
      }

      result.set(key, sourceCount);
    }

    return result;
  })();

  const userData = userLogData.map((item) => {
    const retentionUserCount = retentionMap.get(item.timestamp.toString()) || 0;
    return {
      timestamp: item.timestamp,
      summary: {
        userCount: item.userCount,
        newUserCount: item.newUserCount,
        retentionUserCount,
        points: item.totalPoints || 0,
        sourceCountMap: sourceCountMap.get(item.timestamp.toString()) || initializeSourceCountMap()
      }
    };
  });

  const chatData = chatLogData.map((item) => {
    return {
      timestamp: item.timestamp,
      summary: {
        chatItemCount: item.chatItemCount,
        chatCount: item.chatCount,
        errorCount: item.errorCount,
        points: item.totalPoints || 0
      }
    };
  });

  const appData = appLogData.map((item) => {
    return {
      timestamp: item.timestamp,
      summary: {
        goodFeedBackCount: item.goodFeedbackCount || 0,
        badFeedBackCount: item.badFeedbackCount || 0,
        chatCount: item.chatCount || 0,
        totalResponseTime: item.totalResponseTime || 0
      }
    };
  });

  return { userData, chatData, appData };
}

function formatDataByTimespan({
  rawData,
  timezone,
  userTimespan,
  chatTimespan,
  appTimespan
}: {
  rawData: AppChatLogSchema[];
  timezone: string;
  userTimespan: AppLogTimespanEnum;
  chatTimespan: AppLogTimespanEnum;
  appTimespan: AppLogTimespanEnum;
}) {
  const processGroups = (timespan: AppLogTimespanEnum) => {
    const groupsMap = new Map<
      number,
      {
        users: Set<string>;
        newUsers: Set<string>;
        chatItemCount: number;
        chatCount: number;
        errorCount: number;
        totalPoints: number;
        goodFeedbackCount: number;
        badFeedbackCount: number;
        totalResponseTime: number;
      }
    >();

    rawData.forEach((item) => {
      const timestamp = getFirstDayTimestamp(new Date(item.updateTime), timespan, timezone);

      let group = groupsMap.get(timestamp);
      if (!group) {
        group = {
          users: new Set<string>(),
          newUsers: new Set<string>(),
          chatItemCount: 0,
          chatCount: 0,
          errorCount: 0,
          totalPoints: 0,
          goodFeedbackCount: 0,
          badFeedbackCount: 0,
          totalResponseTime: 0
        };
        groupsMap.set(timestamp, group);
      }

      if (item.userId) {
        group.users.add(item.userId);
        if (item.isFirstChat) group.newUsers.add(item.userId);
      }

      group.chatItemCount += item.chatItemCount || 0;
      group.chatCount += 1;
      group.errorCount += item.errorCount || 0;
      group.totalPoints += item.totalPoints || 0;
      group.goodFeedbackCount += item.goodFeedbackCount || 0;
      group.badFeedbackCount += item.badFeedbackCount || 0;
      group.totalResponseTime += item.totalResponseTime || 0;
    });

    return Array.from(groupsMap.entries())
      .map(([timestamp, group]) => ({
        date: new Date(timestamp),
        timestamp: timestamp,
        userCount: group.users.size,
        newUserCount: group.newUsers.size,
        uniqueUsers: Array.from(group.users),
        chatItemCount: group.chatItemCount,
        chatCount: group.chatCount,
        errorCount: group.errorCount,
        totalPoints: group.totalPoints,
        goodFeedbackCount: group.goodFeedbackCount,
        badFeedbackCount: group.badFeedbackCount,
        totalResponseTime: group.totalResponseTime
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  return {
    userLogData: processGroups(userTimespan),
    chatLogData: processGroups(chatTimespan),
    appLogData: processGroups(appTimespan)
  };
}

export default NextAPI(handler);
