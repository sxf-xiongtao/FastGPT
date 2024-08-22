import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { MongoInvoice } from '@/service/support/wallet/bill/invoiceSchema';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { MongoTeam } from '@fastgpt/service/support/user/team/teamSchema';
import { readFromSecondary } from '@fastgpt/service/common/mongo/utils';

export type listQuery = {};

export type listBody = {
  pageNum: number;
  pageSize: number;
  search?: string;
};

export type listResponse = {};

async function handler(
  req: ApiRequestProps<listBody, listQuery>,
  res: ApiResponseType<any>
): Promise<listResponse> {
  const { pageNum = 1, pageSize = 10, search } = req.body;

  const match = await (async () => {
    if (search) {
      const users = await MongoUser.find({
        username: new RegExp(search, 'i')
      });
      const match = {
        $or: [
          { name: new RegExp(search, 'i') },
          { ownerId: { $in: users.map((user: { _id: string }) => user._id) } }
        ]
      };
      const records = await MongoTeam.find(match).select({ _id: 1 });
      return {
        teamId: { $in: records.map((record) => record._id) }
      };
    }

    return {};
  })();

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
    data: records,
    total
  };
}

export default NextAPI(handler);
