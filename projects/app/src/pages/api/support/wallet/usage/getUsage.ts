// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { MongoUsage } from '@fastgpt/service/support/wallet/usage/schema';
import { addDays } from 'date-fns';
import { authUserPer } from '@fastgpt/service/support/permission/user/auth';
import { Types } from '@fastgpt/service/common/mongo';
import { PagingData } from '@/types';
import { UsageItemType } from '@fastgpt/global/support/wallet/usage/type';
import { UsageSourceEnum } from '@fastgpt/global/support/wallet/usage/constants';
import { ReadPermissionVal } from '@fastgpt/global/support/permission/constant';
import { readFromSecondary } from '@fastgpt/service/common/mongo/utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const {
    pageNum = 1,
    pageSize = 10,
    dateStart = addDays(new Date(), -7),
    dateEnd = new Date(),
    source,
    teamMemberId
  } = req.body as {
    pageNum: number;
    pageSize: number;
    dateStart: Date;
    dateEnd: Date;
    source?: UsageSourceEnum;
    teamMemberId: string;
  };

  try {
    await connectToDatabase();

    const { teamId, tmbId, permission } = await authUserPer({
      req,
      authToken: true,
      per: ReadPermissionVal
    });

    const where = {
      teamId: new Types.ObjectId(teamId),
      ...(permission.hasManagePer && teamMemberId ? { tmbId: teamMemberId } : { tmbId }),
      ...(source && { source }),
      time: {
        $gte: new Date(dateStart),
        $lte: new Date(dateEnd)
      }
    };

    // get bill record and total by record
    const [bills, total] = await Promise.all([
      MongoUsage.find(where, undefined, {
        ...readFromSecondary
      })
        .sort({ time: -1 })
        .skip((pageNum - 1) * pageSize)
        .limit(pageSize),
      MongoUsage.countDocuments(where, {
        ...readFromSecondary
      })
    ]);

    jsonRes<PagingData<UsageItemType>>(res, {
      data: {
        pageNum,
        pageSize,
        data: bills.map((bill) => ({
          id: bill._id,
          source: bill.source,
          time: bill.time,
          totalPoints: bill.totalPoints,
          appName: bill.appName,
          list: bill.list
        })),
        total
      }
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
