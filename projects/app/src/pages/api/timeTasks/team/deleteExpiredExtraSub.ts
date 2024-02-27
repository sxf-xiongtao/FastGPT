import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { MongoTeamSub } from '@fastgpt/service/support/wallet/sub/schema';
import { SubTypeEnum } from '@fastgpt/global/support/wallet/sub/constants';

/* 删除过期的订阅 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await authCert({ req, authRoot: true });
    await connectToDatabase();

    const plans = await MongoTeamSub.deleteMany({
      type: [SubTypeEnum.extraDatasetSize, SubTypeEnum.extraPoints],
      expiredTime: { $lte: new Date() }
    });

    console.log('total delete expired plan', plans);

    jsonRes(res, {
      data: plans,
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
