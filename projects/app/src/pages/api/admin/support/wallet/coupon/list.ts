import { NextAPI } from '@/service/middleware/entry';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { MongoTeamCoupon } from '@fastgpt/service/support/wallet/coupon/schema';
import { NextApiRequest, NextApiResponse } from 'next';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await authCert({ req, authRoot: true });

  const result = await MongoTeamCoupon.find({
    expiredAt: { $gt: new Date() },
    redeemedAt: { $exists: false }
  }).lean();

  return result.map((item) => ({
    key: item.key,
    subscriptions: item.subscriptions,
    expiredAt: item.expiredAt
  }));
}

export default NextAPI(handler);
