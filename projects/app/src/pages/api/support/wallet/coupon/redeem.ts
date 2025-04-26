import type { NextApiResponse } from 'next';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { NextAPI } from '@/service/middleware/entry';
import { ApiRequestProps } from '@fastgpt/service/type/next';
import { MongoTeamCoupon } from '@fastgpt/service/support/wallet/coupon/schema';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import {
  StandardSubLevelEnum,
  SubTypeEnum,
  subTypeMap
} from '@fastgpt/global/support/wallet/sub/constants';
import {
  BillPayWayEnum,
  BillStatusEnum,
  BillTypeEnum
} from '@fastgpt/global/support/wallet/bill/constants';
import { MongoBill } from '@/service/support/wallet/bill/schema';
import {
  addExtraDatasetSizeSub,
  addExtraPointsSub,
  addStandardSub
} from '@/service/support/wallet/sub/controller';
import { useIPFrequencyLimit } from '@fastgpt/service/common/middle/reqFrequencyLimit';
import { getNanoid } from '@fastgpt/global/common/string/tools';

export type RedeemCouponQuery = {
  key: string;
};

async function handler(req: ApiRequestProps<{}, RedeemCouponQuery>, res: NextApiResponse<any>) {
  const { teamId, tmbId } = await authCert({
    req,
    authToken: true
  });

  const { key } = req.query;

  await mongoSessionRun(async (session) => {
    const coupon = await MongoTeamCoupon.findOne({ key }, undefined, { session });

    if (
      !coupon ||
      coupon.redeemedAt ||
      (coupon.expiredAt && coupon.expiredAt.getTime() < Date.now())
    ) {
      return Promise.reject('Invalid coupon');
    }

    // Redeem the coupon
    for (const {
      type,
      durationDay,
      totalPoints = 0,
      level,
      extraDatasetSize
    } of coupon.subscriptions) {
      const startTime = new Date();

      // Create Order
      const orderType = subTypeMap[type]?.orderType;
      if (!orderType) return Promise.reject('Invalid subscription type');
      const metadata = (() => {
        if (orderType === BillTypeEnum.standSubPlan) {
          return {
            standSubLevel: level
          };
        } else if (orderType === BillTypeEnum.extraDatasetSub) {
          return {
            datasetSize: extraDatasetSize
          };
        } else if (orderType === BillTypeEnum.extraPoints) {
          return {
            extraPoints: totalPoints
          };
        }
      })();
      await MongoBill.create({
        teamId,
        tmbId,
        orderId: `coupon-${coupon.key}-${getNanoid(5)}`,
        price: 0,
        status: BillStatusEnum.SUCCESS,
        type: orderType,
        metadata: {
          payWay: BillPayWayEnum.coupon,
          month: (durationDay / 30).toFixed(2),
          ...metadata
        }
      });

      // Create bub
      if (type === SubTypeEnum.extraDatasetSize) {
        await addExtraDatasetSizeSub({
          teamId,
          datasetSize: extraDatasetSize || 0,
          durationDay,
          price: 0,
          session
        });
      } else if (type === SubTypeEnum.extraPoints) {
        await addExtraPointsSub({
          teamId,
          points: totalPoints,
          durationDay,
          price: 0,
          session
        });
      } else if (type === SubTypeEnum.standard) {
        // @ts-ignore
        if (!level || !Object.values(StandardSubLevelEnum).includes(level))
          return Promise.reject('Invalid subscription level');
        await addStandardSub({
          teamId,
          level,
          totalPoints,
          durationDay,
          session
        });
      }
    }

    // Update coupon status
    coupon.redeemedAt = new Date();
    await coupon.save({ session });
  });
}

export default NextAPI(useIPFrequencyLimit({ id: 'redeem-coupon', seconds: 1, limit: 1 }), handler);
