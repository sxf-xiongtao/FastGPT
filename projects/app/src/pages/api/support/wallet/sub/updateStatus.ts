import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { MongoTeamSub } from '@fastgpt/service/support/wallet/sub/schema';
import { SubStatusEnum, SubTypeEnum } from '@fastgpt/global/support/wallet/sub/constants';

/* 更新订阅状态 */

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    const { teamId } = await authCert({ req, authToken: true });
    const { status, type } = req.body as { status: `${SubStatusEnum}`; type: `${SubTypeEnum}` };

    await MongoTeamSub.findOneAndUpdate({ teamId, type: type }, { $set: { status } });

    jsonRes(res, {
      message: 'success'
    });
  } catch (error) {
    console.log(error);

    jsonRes(res, {
      code: 500,
      error
    });
  }
}
