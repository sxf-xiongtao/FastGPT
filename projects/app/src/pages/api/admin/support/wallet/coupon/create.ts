import { NextAPI } from '@/service/middleware/entry';
import { getNanoid } from '@fastgpt/global/common/string/tools';
import type { TeamCouponSub } from '@fastgpt/global/support/wallet/sub/coupon/type';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { MongoTeamCoupon } from '@fastgpt/service/support/wallet/coupon/schema';
import type { ApiRequestProps } from '@fastgpt/service/type/next';
import type { NextApiResponse } from 'next';

export type CreateCouponBody = {
  subscriptions: TeamCouponSub[];
  count: number;
};

async function handler(
  req: ApiRequestProps<CreateCouponBody>,
  res: NextApiResponse
): Promise<string[]> {
  await authCert({ req, authRoot: true });

  const { subscriptions, count } = req.body;

  if (count && count <= 0) {
    return Promise.reject('数量必须大于0');
  }

  if (!subscriptions || !subscriptions.length) {
    return Promise.reject('缺少字段');
  }

  // Check subscriptions
  for (const subscription of subscriptions) {
    if (!subscription.type || !subscription.durationDay) {
      return Promise.reject('缺少字段');
    }
  }

  const keys = Array.from({ length: count || 1 }, () => getNanoid(24));

  await MongoTeamCoupon.create(
    keys.map((key) => ({
      key,
      subscriptions: subscriptions.map((item) => ({
        type: item.type,
        durationDay: item.durationDay,
        level: item.level,
        extraDatasetSize: item.extraDatasetSize,
        totalPoints: item.totalPoints
      }))
    }))
  );

  for (const key of keys) {
  }

  return keys;
}

export default NextAPI(handler);
