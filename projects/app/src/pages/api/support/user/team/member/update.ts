import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { authTeamRole } from '@/service/support/user/team/controller';
import { TeamMemberRoleEnum } from '@fastgpt/global/support/user/team/constant';
import { MongoTeamMember } from '@/service/support/user/team/teamMemberSchema';
import { UpdateTeamMemberProps } from '@fastgpt/global/support/user/team/controller';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { teamId, memberId, role, status } = req.body as UpdateTeamMemberProps;
    await connectToDatabase();
    const { tmbId } = await authCert({ req, authToken: true });

    await authTeamRole({ teamId, tmbId, role: TeamMemberRoleEnum.owner });

    await MongoTeamMember.findByIdAndUpdate(memberId, {
      ...(role && { role }),
      ...(status && { status })
    });

    jsonRes(res, {});
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
