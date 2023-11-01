import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { authUser } from '@fastgpt/service/support/user/auth';
import { MongoTeamMember } from '@/service/support/user/team/teamMemberSchema';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { teamId } = req.query as { teamId: string };
    await connectToDatabase();
    const { userId } = await authUser({ req, authToken: true });

    await MongoTeamMember.findOneAndDelete({
      teamId,
      userId
    });

    jsonRes(res, {});
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
