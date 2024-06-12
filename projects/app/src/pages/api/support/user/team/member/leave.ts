import type { NextApiRequest, NextApiResponse } from 'next';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { NextAPI } from '@/service/middleware/entry';
import { removeUser } from '@/service/support/user/team/controller';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { teamId } = req.query as { teamId: string };
  const { tmbId } = await authCert({ req, authToken: true });

  // Can not leave default team or owner team
  await removeUser({
    teamId,
    memberId: tmbId
  });
}

export default NextAPI(handler);
