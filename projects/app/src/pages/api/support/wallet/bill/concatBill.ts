import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { ConcatBillProps } from '@fastgpt/global/support/wallet/bill/api.d';
import { addLog } from '@fastgpt/service/common/system/log';
import { MongoBill } from '@fastgpt/service/support/wallet/bill/schema';
import { updateTeamBalance } from '@/service/support/wallet/controller';
import { authCert } from '@fastgpt/service/support/permission/auth/common';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    await authCert({ req, authRoot: true });
    const {
      teamId,
      billId,
      total,
      listIndex,
      inputTokens = 0,
      outputTokens = 0
    } = req.body as ConcatBillProps;

    if (!billId) return;
    await MongoBill.findByIdAndUpdate(billId, {
      $inc: {
        total,
        ...(listIndex !== undefined && {
          [`list.${listIndex}.amount`]: total,
          [`list.${listIndex}.inputTokens`]: inputTokens,
          [`list.${listIndex}.outputTokens`]: outputTokens
        })
      }
    });
    await updateTeamBalance({ teamId, amount: -total });

    jsonRes(res);
  } catch (err) {
    addLog.error('Concat Bill Error', err);
    jsonRes(res);
  }
}
