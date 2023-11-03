/* switch team to new team */
import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { authUser } from '@fastgpt/service/support/user/auth';
import { authMemberExistTeam } from '@/service/support/user/team/controller';
import { createJWT } from '@fastgpt/service/support/permission/controller';
import { TeamErrEnum } from '@fastgpt/global/common/error/errorCode';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { teamId = '' } = req.body as { teamId: string };
    await connectToDatabase();
    const { userId } = await authUser({ req, authToken: true });

    // auth user in team and get tmbId
    const tmb = await authMemberExistTeam({ userId, teamId });
    if (!tmb) {
      throw new Error(TeamErrEnum.unAuthTeam);
    }

    jsonRes(res, {
      data: {
        cookie: createJWT({
          _id: userId,
          team: { teamId: tmb.teamId, tmbId: tmb._id }
        })
      }
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
