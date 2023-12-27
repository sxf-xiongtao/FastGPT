// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { MongoBill } from '@fastgpt/service/support/wallet/bill/schema';
import { formatPriceStore2Read } from '@fastgpt/global/support/wallet/bill/tools';
import { addDays } from 'date-fns';
import { authUserRole } from '@fastgpt/service/support/permission/auth/user';
import { Types } from '@fastgpt/service/common/mongo';
import { TeamMemberCollectionName } from '@fastgpt/global/support/user/team/constant';
import { PagingData } from '@/types';
import { BillItemType } from '@fastgpt/global/support/wallet/bill/type';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    const {
      pageNum = 1,
      pageSize = 10,
      dateStart = addDays(new Date(), -7),
      dateEnd = new Date()
    } = req.body as {
      pageNum: number;
      pageSize: number;
      dateStart: Date;
      dateEnd: Date;
    };

    const { teamId, tmbId, isOwner } = await authUserRole({ req, authToken: true });

    const where = {
      ...(isOwner ? { teamId: new Types.ObjectId(teamId) } : { tmbId: new Types.ObjectId(tmbId) }),
      time: {
        $gte: new Date(dateStart),
        $lte: new Date(dateEnd)
      }
    };

    // get bill record and total by record
    const [bills, total] = await Promise.all([
      MongoBill.aggregate([
        { $match: where },
        {
          $lookup: {
            from: TeamMemberCollectionName,
            localField: 'tmbId',
            foreignField: '_id',
            as: 'teamMemberDetails'
          }
        },
        { $unwind: '$teamMemberDetails' },
        {
          $project: {
            _id: 1,
            source: 1,
            time: 1,
            total: 1,
            appName: 1,
            list: 1,
            memberName: '$teamMemberDetails.name'
          }
        },
        { $sort: { time: -1 } },
        { $skip: (pageNum - 1) * pageSize },
        { $limit: pageSize }
      ]),
      MongoBill.countDocuments(where)
    ]);

    jsonRes<PagingData<BillItemType>>(res, {
      data: {
        pageNum,
        pageSize,
        data: bills.map((bill) => ({
          id: bill._id,
          memberName: bill.memberName,
          source: bill.source,
          time: bill.time,
          total: formatPriceStore2Read(bill.total),
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
