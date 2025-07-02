import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { MongoInvoice } from '@/service/support/wallet/bill/invoiceSchema';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { MongoTeam } from '@fastgpt/service/support/user/team/teamSchema';
import { readFromSecondary } from '@fastgpt/service/common/mongo/utils';
import type { PaginationResponse } from '@fastgpt/web/common/fetch/type';
import type { InvoiceSchemaType } from '@fastgpt/global/support/wallet/bill/type';

export type listQuery = {};

export type listBody = {
  pageNum: number;
  pageSize: number;
  search?: string;
};

export type listResponse = PaginationResponse<InvoiceSchemaType>;

async function handler(
  req: ApiRequestProps<listBody, listQuery>,
  res: ApiResponseType<any>
): Promise<listResponse> {
  const { pageNum = 1, pageSize = 10, search } = req.body;

  const match = search ? { teamName: new RegExp(search, 'i') } : {};

  const [records, total] = await Promise.all([
    MongoInvoice.find(match, undefined, {
      skip: (pageNum - 1) * pageSize,
      limit: pageSize,
      ...readFromSecondary
    })
      .select('-file')
      .sort({ status: 1, createTime: -1 }),
    MongoInvoice.countDocuments(match, {
      ...readFromSecondary
    })
  ]);

  return {
    list: records,
    total
  };
}

export default NextAPI(handler);
