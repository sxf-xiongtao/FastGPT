import { type CreateCouponBody } from '@/pages/api/admin/support/wallet/coupon/create';
import { CouponTypeEnum } from '@fastgpt/global/support/wallet/sub/coupon/constants';

export const invalidCouponTypeBody: CreateCouponBody = {
  count: 1,
  subscriptions: [
    {
      // @ts-ignore
      type: 'invalid',
      durationDay: 5,
      level: 'experience',
      totalPoints: 2000
    }
  ]
};
export const invalidCouponLevelBody: CreateCouponBody = {
  count: 1,
  subscriptions: [
    {
      type: 'standard',
      durationDay: 5,
      // @ts-ignore
      level: 'invalid',
      totalPoints: 2000
    }
  ]
};

export const oneCouponBody: CreateCouponBody = {
  count: 1,
  type: CouponTypeEnum.activity,
  subscriptions: [
    {
      type: 'standard',
      durationDay: 5,
      level: 'experience',
      totalPoints: 2000
    }
  ]
};

export const twoCouponBody: CreateCouponBody = {
  count: 2,
  type: CouponTypeEnum.activity,
  subscriptions: [
    {
      type: 'standard',
      durationDay: 5,
      level: 'experience',
      totalPoints: 2000
    },
    {
      type: 'extraPoints',
      durationDay: 10,
      totalPoints: 3000
    },
    {
      type: 'extraPoints',
      durationDay: 5,
      totalPoints: 1000
    },
    {
      type: 'extraDatasetSize',
      durationDay: 10,
      extraDatasetSize: 3000
    },
    {
      type: 'extraDatasetSize',
      durationDay: 2,
      extraDatasetSize: 1000
    }
  ]
};
