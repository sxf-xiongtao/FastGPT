import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { addLog } from '@fastgpt/service/common/mongo/controller';
import { MongoTeam } from '@/service/support/user/team/teamSchema';
import { authCert } from '@fastgpt/service/support/permission/auth/common';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    await authCert({ req, authRoot: true });
    const { teamId } = req.query as { teamId: string };

    const team = await MongoTeam.findById(teamId, '_id balance');

    if (!team || team.balance < 0) {
      return jsonRes(res, {
        code: 500,
        message: '团队余额不足'
      });
    }

    jsonRes(res);
  } catch (err) {
    addLog.error('Concat Bill Error', err);
    jsonRes(res);
  }
}
