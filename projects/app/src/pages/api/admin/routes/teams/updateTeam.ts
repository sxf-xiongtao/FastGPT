import { jsonRes } from '@fastgpt/service/common/response';
import { MongoTeam } from '@fastgpt/service/support/user/team/teamSchema';
import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/service/mongo';
import { adminCert } from '@/service/support/permission/adminCert';
import { PRICE_SCALE } from '@fastgpt/global/support/wallet/constants';

export default async function updateTeam(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    await adminCert({ req, authToken: true });

    let { id, balance, name } = req.body;

    await MongoTeam.findByIdAndUpdate(id, {
      ...(name && { name: name }),
      ...(balance !== undefined && { balance: balance * PRICE_SCALE })
    });

    jsonRes(res, {
      data: {
        ...(balance && { balance })
      }
    });
  } catch (err) {
    console.log(`Error updating team: ${err}`);
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
