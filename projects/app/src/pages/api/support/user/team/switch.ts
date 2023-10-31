/* switch team to new team */
import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { authUser } from '@fastgpt/service/support/user/auth';
import { authTeamRole } from '@/service/support/user/team/controller';
import { createJWT, setCookie } from '@fastgpt/service/support/permission/controller';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { teamId } = req.body as { teamId: string };
    await connectToDatabase();
    const { userId } = await authUser({ req, authToken: true });
    const { _id: teamMemberId } = await authTeamRole({ userId, teamId });

    const token = createJWT(userId, teamMemberId);
    setCookie(res, token);

    jsonRes(res, {
      data: token
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
