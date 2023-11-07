import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { MongoPay } from '@/service/support/wallet/pay/schema';
import { authUserRole } from '@fastgpt/service/support/permission/auth/user';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    const { teamId, tmbId, teamOwner } = await authUserRole({ req, authToken: true });

    const records = await MongoPay.find({
      teamId,
      ...(!teamOwner && { tmbId }),
      status: { $ne: 'CLOSED' }
    })
      .sort({ createTime: -1 })
      .limit(100);

    jsonRes(res, {
      data: records
    });
  } catch (err) {
    console.log(err);
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
