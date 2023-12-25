import { createHashPassword } from '@/utils/tools';
import { jsonRes } from '@fastgpt/service/common/response';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/service/mongo';
import { adminCert } from '@/service/support/permission/adminCert';

export default async function updateUser(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    await adminCert({ req, authToken: true });

    let { id: tmbId, password, status } = req.body;

    const tmb = await MongoTeamMember.findById(tmbId);

    const result = await MongoUser.findByIdAndUpdate(tmb?.userId, {
      ...(password && { password: createHashPassword(password) }),
      ...(status && { status })
    });

    jsonRes(res, {
      data: {
        result
      }
    });
  } catch (err) {
    console.log(`Error updating user: ${err}`);
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
