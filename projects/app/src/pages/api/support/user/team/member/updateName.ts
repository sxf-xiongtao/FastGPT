import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { name } = req.body as { name: string };
    await connectToDatabase();
    const { tmbId } = await authCert({ req, authToken: true });

    if (!name) {
      throw new Error('name is required');
    }

    await MongoTeamMember.findByIdAndUpdate(tmbId, {
      name: name.slice(0, 20)
    });

    jsonRes(res, {});
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
