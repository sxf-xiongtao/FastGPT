import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { CreateUsageProps } from '@fastgpt/global/support/wallet/usage/api.d';
import { addLog } from '@fastgpt/service/common/system/log';
import { MongoUsage } from '@fastgpt/service/support/wallet/usage/schema';
import { pushReduceTeamAiPointsTask } from '@/service/support/wallet/controller';
import { authCert } from '@fastgpt/service/support/permission/auth/common';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    await authCert({ req, authRoot: true });
    const data = req.body as CreateUsageProps;

    await createUsage(data);

    jsonRes(res);
  } catch (err) {
    addLog.error('Create Usage Error', err);

    jsonRes(res);
  }
}

export const createUsage = (data: CreateUsageProps) => {
  return Promise.all([
    MongoUsage.create(data),
    pushReduceTeamAiPointsTask({ teamId: data.teamId, totalPoints: data.totalPoints })
  ]);
};
