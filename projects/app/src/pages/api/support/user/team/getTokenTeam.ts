import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { authUser } from '@fastgpt/service/support/user/auth';
import { teamMemberSchema2TeamItemType } from '@/service/support/user/team/controller';
import { MongoTeamMember } from '@/service/support/user/team/teamMemberSchema';
import { TeamMemberSchemaWithTeamAndUser } from '@/global/user/team';
import { ERROR_ENUM } from '@fastgpt/global/common/error/errorCode';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    const { userId, tmbId } = await authUser({ req, authToken: true });

    const teamMember = (await MongoTeamMember.findOne({
      _id: tmbId,
      userId
    }).populate('teamId userId')) as TeamMemberSchemaWithTeamAndUser;

    if (!teamMember) {
      throw new Error(ERROR_ENUM.unAuthTeam);
    }

    return jsonRes(res, {
      data: teamMemberSchema2TeamItemType(teamMember)
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
