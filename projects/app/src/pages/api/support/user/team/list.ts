import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { getUserTeams } from '@/service/support/user/team/controller';
import { TeamMemberSchema } from '@fastgpt/global/support/user/team/type';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    const { status } = req.query as { status: `${TeamMemberSchema['status']}` };
    const { userId } = await authCert({ req, authToken: true });

    jsonRes(res, {
      data: await getUserTeams({
        userId,
        status
      })
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
