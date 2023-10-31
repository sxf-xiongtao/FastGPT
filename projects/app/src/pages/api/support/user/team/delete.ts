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
    const { id } = req.body as UpdateTeamProps;
    const { userId } = await authUser({ req, authToken: true });

    if (await authTeamRole({ userId, teamId: id, role: TeamMemberRoleEnum.owner })) {
      await deleteTeam(id);
      return jsonRes(res);
    }

    throw new Error("You don't have permission to operate the team");
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
