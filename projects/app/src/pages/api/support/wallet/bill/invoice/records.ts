import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { authUserPer } from '@fastgpt/service/support/permission/user/auth';
import { ReadPermissionVal } from '@fastgpt/global/support/permission/constant';
import { MongoInvoice } from '@/service/support/wallet/bill/invoiceSchema';

export type recordsQuery = {};

export type recordsBody = { pageNum: number; pageSize: number };

export type recordsResponse = {};

async function handler(
  req: ApiRequestProps<recordsBody, recordsQuery>,
  res: ApiResponseType<any>
): Promise<recordsResponse> {
  const { pageNum = 1, pageSize = 10 } = req.body;
  const { teamId } = await authUserPer({ req, authToken: true, per: ReadPermissionVal });

  const [records, total] = await Promise.all([
    MongoInvoice.find({ teamId }, undefined, {
      skip: (pageNum - 1) * pageSize,
      limit: pageSize
    })
      .select('-file')
      .sort({ createTime: -1 }),
    MongoInvoice.countDocuments({ teamId })
  ]);

  return {
    data: records,
    total
  };
}

export default NextAPI(handler);
