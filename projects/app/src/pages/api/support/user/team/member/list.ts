import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { getTeamMembers } from '@/service/support/user/team/controller';
import type { TeamMemberItemType } from '@fastgpt/global/support/user/team/type.d';
import { NextAPI } from '@/service/middleware/entry';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { teamId } = await authCert({ req, authToken: true });

  jsonRes<TeamMemberItemType[]>(res, {
    data: await getTeamMembers(teamId)
  });
}

export default NextAPI(handler);
