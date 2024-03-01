import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { ConcatUsageProps } from '@fastgpt/global/support/wallet/usage/api.d';
import { addLog } from '@fastgpt/service/common/system/log';
import {
  pushConcatBillTask,
  pushReduceTeamAiPointsTask
} from '@/service/support/wallet/controller';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { Types } from '@fastgpt/service/common/mongo';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    await authCert({ req, authRoot: true });
    const body = req.body as ConcatUsageProps;

    await concatUsage(body);

    jsonRes(res);
  } catch (err) {
    addLog.error('Push Concat Usage Error', err);
    console.log(err);

    jsonRes(res);
  }
}

export const concatUsage = async ({
  teamId,
  billId,
  totalPoints = 0,
  listIndex,
  tokens = 0
}: ConcatUsageProps) => {
  // 没有Id，或者不符合 mongoose ObjectId
  if (!billId || !Types.ObjectId.isValid(billId)) return;

  pushConcatBillTask([
    {
      billId,
      listIndex,
      tokens,
      totalPoints
    }
  ]);
  pushReduceTeamAiPointsTask({ teamId, totalPoints });
};
