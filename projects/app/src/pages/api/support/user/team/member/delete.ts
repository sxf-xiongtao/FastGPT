import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { authUser } from '@fastgpt/service/support/user/auth';
import { authTeamRole } from '@/service/support/user/team/controller';
import { TeamMemberRoleEnum } from '@fastgpt/global/support/user/team/constant';
import { MongoTeamMember } from '@/service/support/user/team/teamMemberSchema';
import { DelMemberProps } from '@fastgpt/global/support/user/team/controller';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { teamId, memberId } = req.query as DelMemberProps;
    await connectToDatabase();
    const { tmbId } = await authUser({ req, authToken: true });

    await authTeamRole({ teamId, tmbId, role: TeamMemberRoleEnum.owner });

    await MongoTeamMember.findOneAndDelete({
      _id: memberId,
      teamId
    });

    jsonRes(res, {});
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
