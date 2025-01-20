import type { NextApiRequest, NextApiResponse } from 'next';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { NextAPI } from '@/service/middleware/entry';
import { removeUserFromTeam } from '@/service/support/user/controller';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { teamId, tmbId } = await authCert({ req, authToken: true });

  // Can not leave default team or owner team
  await removeUserFromTeam({
    teamId,
    memberId: tmbId
  });
}

export default NextAPI(handler);
