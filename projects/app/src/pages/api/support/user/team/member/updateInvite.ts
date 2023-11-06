import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { authUser } from '@fastgpt/service/support/permission/auth/user';
import { MongoTeamMember } from '@/service/support/user/team/teamMemberSchema';
import { UpdateInviteProps } from '@fastgpt/global/support/user/team/controller';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { tmbId, status } = req.body as UpdateInviteProps;
    await connectToDatabase();
    const { userId } = await authUser({ req, authToken: true });

    const tmb = await MongoTeamMember.findOne({
      _id: tmbId,
      userId
    });
    if (!tmb) {
      throw new Error('Record not found');
    }

    tmb.status = status;
    await tmb.save();

    jsonRes(res);
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
