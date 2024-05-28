import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { MongoBill } from '@/service/support/wallet/bill/schema';
import { MongoTeam } from '@fastgpt/service/support/user/team/teamSchema';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { MongoUser } from '@fastgpt/service/support/user/schema';

export type updateInvoiceQuery = {};

export type updateInvoiceBody = {
  usernameList?: string[];
  orderId?: string;
};

export type updateInvoiceResponse = {};

async function handler(
  req: ApiRequestProps<updateInvoiceBody, updateInvoiceQuery>,
  res: ApiResponseType<any>
): Promise<updateInvoiceResponse> {
  const { usernameList, orderId } = req.body;

  await authCert({ req, authRoot: true });

  const where = await (async () => {
    if (orderId) {
      return { orderId };
    }
    if (usernameList) {
      const users = await MongoUser.find(
        {
          username: { $in: usernameList }
        },
        '_id'
      );
      const tmbList = await MongoTeamMember.find(
        {
          userId: { $in: users.map((item) => item._id) }
        },
        '_id'
      );
      return { tmbId: { $in: tmbList.map((item) => item._id) } };
    }
  })();

  await MongoBill.updateMany(where, {
    $set: {
      hasInvoice: true
    }
  });

  return {};
}

export default NextAPI(handler);
