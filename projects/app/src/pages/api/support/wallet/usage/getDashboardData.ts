import { NextAPI } from '@/service/middleware/entry';
import { ReadPermissionVal } from '@fastgpt/global/support/permission/constant';
import {
  GetUsageDashboardProps,
  GetUsageDashboardResponseItem
} from '@fastgpt/global/support/wallet/usage/api';
import { Types } from '@fastgpt/service/common/mongo';
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
            tmbId: { $in: teamMemberIds }
          }
        : {}
      : { tmbId }),
    ...(sources && { source: sources })
  };

  const data = (await MongoUsage.aggregate([
    { $match: where },
    {
      $group: {
        _id: {
          year: { $year: '$time' },
          month: { $month: '$time' },
          day: { $dayOfMonth: '$time' }
        },
        totalPoints: { $sum: '$totalPoints' }
      }
    },
    {
      $project: {
        _id: 0,
        date: { $dateFromParts: { year: '$_id.year', month: '$_id.month', day: '$_id.day' } },
        totalPoints: 1
      }
    },
    { $sort: { date: 1 } }
  ])) as GetUsageDashboardResponseItem[];

  // Generate complete date range
  const concatData: GetUsageDashboardResponseItem[] = [];
  let currentDate = dayjs(dateStart);
  const endDate = dayjs(dateEnd);

  while (currentDate.isBefore(endDate)) {
    console.log(data[0], currentDate);
    concatData.push({
      date: currentDate.toDate(),
      totalPoints:
        data.find(
          (item) => dayjs(item.date).format('YYYY-MM-DD') === currentDate.format('YYYY-MM-DD')
        )?.totalPoints || 0
    });
    currentDate = currentDate.add(1, 'day');
  }

  return concatData;
}

export default NextAPI(handler);
