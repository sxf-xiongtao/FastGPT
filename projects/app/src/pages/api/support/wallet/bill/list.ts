import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { MongoBill } from '@/service/support/wallet/bill/schema';
import { authUserRole } from '@fastgpt/service/support/permission/auth/user';
import { BillTypeEnum } from '@fastgpt/global/support/wallet/bill/constants';
import type { PagingData } from '@/types';
import { BillSchemaType } from '@fastgpt/global/support/wallet/bill/type';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      pageNum = 1,
      pageSize = 20,
      type
    } = req.body as {
      pageNum: number;
      pageSize: number;
      type?: `${BillTypeEnum}`;
    };
    await connectToDatabase();
    const { teamId } = await authUserRole({ req, authToken: true });

    const match = {
      teamId,
      status: { $ne: 'CLOSED' },
      ...(type && { type })
    };

    const [records, total] = await Promise.all([
      MongoBill.find(match)
        .sort({ createTime: -1 })
        .skip((pageNum - 1) * pageSize)
        .limit(pageSize),
      MongoBill.countDocuments(match)
    ]);

    jsonRes<PagingData<BillSchemaType>>(res, {
      data: {
        pageNum,
        pageSize,
        data: records,
        total
      }
    });
  } catch (err) {
    console.log(err);
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
