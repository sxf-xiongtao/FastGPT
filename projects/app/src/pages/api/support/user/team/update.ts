import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { authTeamRole, updateTeam } from '@/service/support/user/team/controller';
import { UpdateTeamProps } from '@fastgpt/global/support/user/team/controller';
import { TeamMemberRoleEnum } from '@fastgpt/global/support/user/team/constant';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    const body = req.body as UpdateTeamProps;
    const { tmbId } = await authCert({ req, authToken: true });

    if (await authTeamRole({ teamId: body.teamId, tmbId, role: TeamMemberRoleEnum.owner })) {
      return jsonRes(res, {
        data: await updateTeam(body)
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
