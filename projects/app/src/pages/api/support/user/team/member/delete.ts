import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { authTeamRole } from '@/service/support/user/team/controller';
import {
  TeamMemberRoleEnum,
  TeamMemberStatusEnum
} from '@fastgpt/global/support/user/team/constant';
import { DelMemberProps } from '@fastgpt/global/support/user/team/controller';
import { MongoTeamMember } from '@/service/support/user/team/teamMemberSchema';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { teamId, memberId } = req.query as DelMemberProps;
    await connectToDatabase();
    const { tmbId } = await authCert({ req, authToken: true });

    await authTeamRole({ teamId, tmbId, role: TeamMemberRoleEnum.owner });

    // update status is leave
    await MongoTeamMember.findOneAndUpdate(
      {
        _id: memberId,
        teamId
      },
      {
        status: TeamMemberStatusEnum.leave
      }
    );

    jsonRes(res, {});
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
