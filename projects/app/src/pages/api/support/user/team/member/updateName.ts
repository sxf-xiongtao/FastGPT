import type { NextApiRequest, NextApiResponse } from 'next';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { NextAPI } from '@/service/middleware/entry';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { name } = req.body as { name: string };
  const { tmbId } = await authCert({ req, authToken: true });

  if (!name) {
    throw new Error('name is required');
  }

  await MongoTeamMember.findByIdAndUpdate(tmbId, {
    name: name.slice(0, 20)
  });
}
export default NextAPI(handler);
