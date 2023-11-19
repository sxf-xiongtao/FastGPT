/* switch team to new team */
import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { authUserExistTeam } from '@/service/support/user/team/controller';
import { createJWT } from '@fastgpt/service/support/permission/controller';
import { TeamErrEnum } from '@fastgpt/global/common/error/code/team';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { teamId = '' } = req.body as { teamId: string };
    await connectToDatabase();
    const { userId } = await authCert({ req, authToken: true });

    // auth user in team and get tmbId
    const tmb = await authUserExistTeam({ userId, teamId });
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
