/* switch team to new team */
import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { authUserExistTeam } from '@/service/support/user/team/controller';
import { createJWT, setCookie } from '@fastgpt/service/support/permission/controller';
import { TeamErrEnum } from '@fastgpt/global/common/error/code/team';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { NextAPI } from '@/service/middleware/entry';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { teamId = '' } = req.body as { teamId: string };
  const { userId } = await authCert({ req, authToken: true });

  // auth user in team and get tmbId
  const tmb = await authUserExistTeam({ userId, teamId });
  if (!tmb) {
    throw new Error(TeamErrEnum.unAuthTeam);
  }

  // update user lastLoginTmbId
  await MongoUser.findByIdAndUpdate(userId, { lastLoginTmbId: tmb._id });

  const token = createJWT({
    _id: userId,
    team: { teamId: tmb.teamId, tmbId: tmb._id }
  });
  setCookie(res, token);

  jsonRes(res, {
    data: token
  });
}

export default NextAPI(handler);
