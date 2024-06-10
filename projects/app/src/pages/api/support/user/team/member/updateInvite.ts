import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { UpdateInviteProps } from '@fastgpt/global/support/user/team/controller';
import { NextAPI } from '@/service/middleware/entry';

/* update invite status */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { tmbId, status } = req.body as UpdateInviteProps;
  await connectToDatabase();
  const { userId } = await authCert({ req, authToken: true });

  const tmb = await MongoTeamMember.findOne({
    _id: tmbId,
    userId
  });
  if (!tmb) {
    throw new Error('Record not found');
  }

  tmb.status = status;
  await tmb.save();
}

export default NextAPI(handler);
