import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { authUser } from '@fastgpt/service/support/user/auth';
import { authTeamRole, getTeamInfo } from '@/service/support/user/team/controller';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query as { id: string };
    await connectToDatabase();
    const { userId } = await authUser({ req, authToken: true });

    if (await authTeamRole({ userId, teamId: id })) {
      return jsonRes(res, {
        data: getTeamInfo(id)
      });
    }

    throw new Error("You don't have permission to operate the team");
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
