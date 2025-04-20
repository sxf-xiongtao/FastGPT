import { NextAPI } from '@/service/middleware/entry';
import { getMongoTimezoneCode } from '@fastgpt/global/common/time/timezone';
import { ReadPermissionVal } from '@fastgpt/global/support/permission/constant';
import {
  GetUsageDashboardProps,
  GetUsageDashboardResponseItem
} from '@fastgpt/global/support/wallet/usage/api';
import { Types } from '@fastgpt/service/common/mongo';
import { readFromSecondary } from '@fastgpt/service/common/mongo/utils';
import { authUserPer } from '@fastgpt/service/support/permission/user/auth';
import { MongoUsage } from '@fastgpt/service/support/wallet/usage/schema';
import { ApiRequestProps } from '@fastgpt/service/type/next';
import dayjs from 'dayjs';
import { NextApiResponse } from 'next';

async function handler(
  req: ApiRequestProps<GetUsageDashboardProps>,
  res: NextApiResponse
): Promise<GetUsageDashboardResponseItem[]> {
  const { dateStart: rawDateStart, dateEnd: rawDateEnd, teamMemberIds, sources, unit } = req.body;

  const { teamId, tmbId, permission } = await authUserPer({
    req,
    authToken: true,
    per: ReadPermissionVal
  });

  const dateStart = dayjs(rawDateStart).toDate();
  const dateEnd = dayjs(rawDateEnd).toDate();

  const where = {
    teamId: new Types.ObjectId(teamId),
    time: {
      $gte: new Date(dateStart),
      $lte: new Date(dateEnd)
    },
    // 非管理员只能看自己。管理员可以看所有人或者指定人。
    ...(permission.hasManagePer
      ? teamMemberIds
        ? {
            tmbId: { $in: teamMemberIds.map((id) => new Types.ObjectId(id)) }
          }
        : {}
      : { tmbId }),
    ...(sources && { source: { $in: sources } })
  };

  const data = (await MongoUsage.aggregate(
    [
      { $match: where },
      {
        $addFields: {
          localTime: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$time',
              timezone: getMongoTimezoneCode(rawDateStart)
            }
          }
        }
      },
      {
        $group: {
          _id: '$localTime',
          totalPoints: { $sum: '$totalPoints' }
        }
      },
      {
        $project: {
          _id: 0,
          date: { $dateFromString: { dateString: '$_id' } },
          totalPoints: 1
        }
      },
      { $sort: { date: 1 } }
    ],
    {
      ...readFromSecondary
    }
  )) as GetUsageDashboardResponseItem[];

  return data;
}

export default NextAPI(handler);
