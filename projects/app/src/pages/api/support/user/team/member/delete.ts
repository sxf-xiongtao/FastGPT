import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { authTeamRole, removeUser } from '@/service/support/user/team/controller';
import { TeamMemberRoleEnum } from '@fastgpt/global/support/user/team/constant';
import { DelMemberProps } from '@fastgpt/global/support/user/team/controller';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { teamId, memberId } = req.query as DelMemberProps;
    await connectToDatabase();
    const { tmbId } = await authCert({ req, authToken: true });

    await authTeamRole({ teamId, tmbId, role: TeamMemberRoleEnum.owner });

    await removeUser(memberId);

    jsonRes(res, {});
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
