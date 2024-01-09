import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { addLog } from '@fastgpt/service/common/system/log';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { authTeamBalance } from '@/service/support/user/team/utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    await authCert({ req, authRoot: true });
    const { teamId } = req.query as { teamId: string };

    await authTeamBalance(teamId, 0);

    jsonRes(res);
  } catch (err) {
    addLog.error('Concat Bill Error', err);
    jsonRes(res);
  }
}
