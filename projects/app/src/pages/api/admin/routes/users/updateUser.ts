import { createHashPassword } from '@/utils/tools';
import { jsonRes } from '@fastgpt/service/common/response';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { MongoTeam } from '@fastgpt/service/support/user/team/teamSchema';
import { NextApiRequest, NextApiResponse } from 'next';
import { PRICE_SCALE, formatPrice } from './getUsers';
import { connectToDatabase } from '@/service/mongo';
import { adminCert } from '@/service/support/permission/adminCert';

export default async function updateUser(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    await adminCert({ req, authToken: true });

    let { id: tmbId, username, password, balance, maxSize, teamName } = req.body;

    const tmb = await MongoTeamMember.findById(tmbId);

    await MongoUser.findByIdAndUpdate(tmb?.userId, {
      ...(username && { username }),
      ...(password && { password: createHashPassword(password) })
    });

    await MongoTeam.findByIdAndUpdate(tmb?.teamId, {
      ...(teamName && { name: teamName }),
      ...(balance !== undefined && { balance: balance * PRICE_SCALE }),
      ...(maxSize !== undefined && { maxSize })
    });

    jsonRes(res, {
      data: {
        ...(balance && { balance: formatPrice(balance * PRICE_SCALE) })
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
