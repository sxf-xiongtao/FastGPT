import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { MongoBill } from '@/service/support/wallet/bill/schema';
import { authUserPer } from '@fastgpt/service/support/permission/user/auth';
import { BillTypeEnum } from '@fastgpt/global/support/wallet/bill/constants';
import { BillSchemaType } from '@fastgpt/global/support/wallet/bill/type';
import { ReadPermissionVal } from '@fastgpt/global/support/permission/constant';
import { readFromSecondary } from '@fastgpt/service/common/mongo/utils';
import { PaginationResponse } from '@fastgpt/web/common/fetch/type';
import { parsePaginationRequest } from '@fastgpt/service/common/api/pagination';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { type } = req.body as {
      type?: BillTypeEnum;
    };
    const { offset, pageSize } = parsePaginationRequest(req);
    await connectToDatabase();
    const { teamId } = await authUserPer({ req, authToken: true, per: ReadPermissionVal });

    const match = {
      teamId,
      status: { $ne: 'CLOSED' },
      ...(type && { type })
    };

    const [records, total] = await Promise.all([
      MongoBill.find(match, undefined, {
        ...readFromSecondary
      })
        .sort({ createTime: -1 })
        .skip(offset)
        .limit(pageSize),
      MongoBill.countDocuments(match, { ...readFromSecondary })
    ]);

    jsonRes<PaginationResponse<BillSchemaType>>(res, {
      data: {
        list: records,
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
