import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { CreateBillProps } from '@fastgpt/global/support/wallet/bill/api.d';
import { addLog } from '@fastgpt/service/common/system/log';
import { MongoBill } from '@fastgpt/service/support/wallet/bill/schema';
import { updateTeamBalance } from '@/service/support/wallet/controller';
import { authCert } from '@fastgpt/service/support/permission/auth/common';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    await authCert({ req, authRoot: true });
    const data = req.body as CreateBillProps;

    await Promise.all([
      MongoBill.create(data),
      updateTeamBalance({ teamId: data.teamId, amount: -data.total })
    ]);

    jsonRes(res);
  } catch (err) {
    addLog.error('Create Bill Error', err);

    jsonRes(res);
  }
}
