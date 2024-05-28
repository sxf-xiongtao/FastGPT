import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { getUserTeams } from '@/service/support/user/team/controller';
import { TeamMemberSchema } from '@fastgpt/global/support/user/team/type';
import { NextAPI } from '@/service/middleware/entry';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { status } = req.query as { status: `${TeamMemberSchema['status']}` };
  const { userId } = await authCert({ req, authToken: true });

  jsonRes(res, {
    data: await getUserTeams({
      userId,
      status
    })
  });
}

export default NextAPI(handler);
