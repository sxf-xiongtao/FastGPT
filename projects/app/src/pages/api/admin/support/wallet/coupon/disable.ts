import { NextAPI } from '@/service/middleware/entry';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { MongoTeamCoupon } from '@fastgpt/service/support/wallet/coupon/schema';
import { ApiRequestProps } from '@fastgpt/service/type/next';
import { NextApiResponse } from 'next';

export type DisableCouponBody = {
  keys: string[];
};

async function handler(req: ApiRequestProps<DisableCouponBody>, res: NextApiResponse) {
  await authCert({ req, authRoot: true });

  const result = await MongoTeamCoupon.updateMany(
    { key: { $in: req.body.keys } },
    { expiredAt: new Date() }
  );

  return result;
}

export default NextAPI(handler);
