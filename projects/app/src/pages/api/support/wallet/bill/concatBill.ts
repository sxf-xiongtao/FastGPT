import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { ConcatBillProps } from '@fastgpt/global/support/wallet/bill/api.d';
import { addLog } from '@fastgpt/service/common/mongo/controller';
import { MongoTeam } from '@/service/support/user/team/teamSchema';
import { MongoBill } from '@fastgpt/service/support/wallet/bill/schema';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    const { teamId, billId, total, listIndex, tokens = 0 } = req.body as ConcatBillProps;

    if (!billId) return;
    await Promise.all([
      MongoBill.findByIdAndUpdate(billId, {
        $inc: {
          total,
          ...(listIndex !== undefined && {
            [`list.${listIndex}.amount`]: total,
            [`list.${listIndex}.tokenLen`]: tokens
          })
        }
      }),
      MongoTeam.findByIdAndUpdate(teamId, {
        $inc: { balance: -total }
      })
    ]);

    jsonRes(res);
  } catch (err) {
    addLog.error('Concat Bill Error', err);
    jsonRes(res);
  }
}
