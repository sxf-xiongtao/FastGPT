// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { MongoBill } from '@fastgpt/service/support/wallet/bill/schema';
import { formatStorePrice2Read } from '@fastgpt/global/support/wallet/bill/tools';
import { addDays } from 'date-fns';
import { authUserRole } from '@fastgpt/service/support/permission/auth/user';
import { Types } from '@fastgpt/service/common/mongo';
import { PagingData } from '@/types';
import { BillItemType } from '@fastgpt/global/support/wallet/bill/type';
import { BillSourceEnum } from '@fastgpt/global/support/wallet/bill/constants';

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
    source?: `${BillSourceEnum}`;
    teamMemberId: string;
  };

  try {
    await connectToDatabase();

    const { teamId, tmbId, isOwner } = await authUserRole({ req, authToken: true });

    const where = {
      teamId: new Types.ObjectId(teamId),
      ...(isOwner && teamMemberId ? { tmbId: teamMemberId } : { tmbId }),
      ...(source && { source }),
      time: {
        $gte: new Date(dateStart),
        $lte: new Date(dateEnd)
      }
    };

    // get bill record and total by record
    const [bills, total] = await Promise.all([
      MongoBill.find(where)
        .sort({ time: -1 })
        .skip((pageNum - 1) * pageSize)
        .limit(pageSize),
      MongoBill.countDocuments(where)
    ]);

    jsonRes<PagingData<BillItemType>>(res, {
      data: {
        pageNum,
        pageSize,
        data: bills.map((bill) => ({
          id: bill._id,
          source: bill.source,
          time: bill.time,
          total: formatStorePrice2Read(bill.total),
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
