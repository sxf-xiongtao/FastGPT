import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { authUser } from '@fastgpt/service/support/user/auth';
import { authTeamRole, deleteTeam } from '@/service/support/user/team/controller';
import { UpdateTeamProps } from '@fastgpt/global/support/user/team/controller';
import { TeamMemberRoleEnum } from '@fastgpt/global/support/user/team/constant';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    const { teamId } = req.body as UpdateTeamProps;
    const { tmbId } = await authUser({ req, authToken: true });
    await authTeamRole({ teamId, tmbId, role: TeamMemberRoleEnum.owner });
    await deleteTeam(teamId);
    return jsonRes(res);
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
