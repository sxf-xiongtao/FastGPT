import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { authUser } from '@fastgpt/service/support/permission/auth/user';
import { createTeam } from '@/service/support/user/team/controller';
import { MongoTeamMember } from '@/service/support/user/team/teamMemberSchema';
import { TeamMemberRoleEnum } from '@fastgpt/global/support/user/team/constant';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    const { userId } = await authUser({ req, authToken: true });

    const count = await MongoTeamMember.countDocuments({
      userId,
      role: TeamMemberRoleEnum.owner
    });

    if (count >= 1) {
      throw new Error('仅限1个团队');
    }

    jsonRes(res, {
      data: await createTeam({
        ...req.body,
        ownerId: userId
      })
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
