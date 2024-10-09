import type { NextApiRequest, NextApiResponse } from 'next';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { getTeamMembers } from '@/service/support/user/team/controller';
import { NextAPI } from '@/service/middleware/entry';

async function handler(req: NextApiRequest, _res: NextApiResponse) {
  const { teamId } = await authCert({ req, authToken: true });

  return getTeamMembers(teamId);
}

export default NextAPI(handler);
