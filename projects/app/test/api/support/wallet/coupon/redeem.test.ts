import { getFakeUsers } from '@test/datas/users';
import { Call } from '@test/utils/request';
import { describe, expect, it } from 'vitest';
import { type CreateCouponBody } from '@/pages/api/admin/support/wallet/coupon/create';
import * as create from '@/pages/api/admin/support/wallet/coupon/create';
import {
  invalidCouponLevelBody,
  invalidCouponTypeBody,
  oneCouponBody,
  twoCouponBody
} from './mock';
import * as redeem from '@/pages/api/support/wallet/coupon/redeem';
import { type RedeemCouponQuery } from '@/pages/api/support/wallet/coupon/redeem';
import { MongoTeamCoupon } from '@fastgpt/service/support/wallet/coupon/schema';
import * as getTeamPlans from '@/pages/api/support/user/team/plan/getTeamPlans';
import type { TeamSubSchema } from '@fastgpt/global/support/wallet/sub/type';
import dayjs from 'dayjs';

describe('Redeem coupon', async () => {
  it('Create invalid sub type coupon', async () => {
    const user = await getFakeUsers();

    // Create one coupon
    const { data: data1 } = await Call<CreateCouponBody>(create.default, {
      auth: user.manager,
      body: invalidCouponTypeBody
    });

    expect(data1).equal(undefined);
  });
  it('Create invalid sub level coupon', async () => {
    const user = await getFakeUsers();

    // Create one coupon
    const { data: data1 } = await Call<CreateCouponBody>(create.default, {
      auth: user.manager,
      body: invalidCouponLevelBody
    });

    expect(data1).equal(undefined);
  });

  it('Create standard coupon and redeem again', async () => {
    const user = await getFakeUsers();

    // Create one coupon
    const { data: data1 } = await Call<CreateCouponBody>(create.default, {
      auth: user.manager,
      body: oneCouponBody
    });
    const key1 = data1[0];
    expect(typeof key1).toBe('string');
    expect(data1.length).toBe(1);

    // Redeem the coupon one
    await Call<{}, RedeemCouponQuery>(redeem.default, {
      auth: user.manager,
      query: {
        key: key1
      }
    });

    const res = await Call<{}, RedeemCouponQuery>(redeem.default, {
      auth: user.manager,
      query: {
        key: key1
      }
    });
    expect(res.error).equal('Invalid coupon');
  });
  it('Redeem expired coupon', async () => {
    const user = await getFakeUsers();

    // Create one coupon
    const { data: data1 } = await Call<CreateCouponBody>(create.default, {
      auth: user.manager,
      body: oneCouponBody
    });
    const key = data1[0];
    // Expired coupon
    await MongoTeamCoupon.updateOne(
      {
        key
      },
      {
        $set: {
          expiredAt: new Date()
        }
      }
    );
    const res = await Call<{}, RedeemCouponQuery>(redeem.default, {
      auth: user.manager,
      query: {
        key
      }
    });
    expect(res.error).equal('Invalid coupon');
  });

  // Check sub result
  it('Check sub result', async () => {
    const user = await getFakeUsers();

    // Create coupon
    const { data: coupon1 } = await Call<CreateCouponBody>(create.default, {
      auth: user.manager,
      body: oneCouponBody
    });
    const { data: coupon2 } = await Call<CreateCouponBody>(create.default, {
      auth: user.manager,
      body: twoCouponBody
    });

    // Get sub list
    let teamPlans = (
      await Call(getTeamPlans.default, {
        auth: user.manager
      })
    ).data;
    expect(teamPlans.length).toBe(0);

    // Use one coupon
    await Call<{}, RedeemCouponQuery>(redeem.default, {
      auth: user.manager,
      query: {
        key: coupon1[0]
      }
    });
    teamPlans = (
      await Call(getTeamPlans.default, {
        auth: user.manager
      })
    ).data;
    expect(
      teamPlans.map((item: TeamSubSchema) => ({
        type: item.type,
        currentSubLevel: item.currentSubLevel,
        totalPoints: item.totalPoints,
        surplusPoints: item.surplusPoints,
        durationDay: dayjs(item.expiredTime).diff(dayjs(item.startTime), 'day')
      }))
    ).toEqual([
      {
        type: 'standard',
        currentSubLevel: 'experience',
        totalPoints: 2000,
        surplusPoints: 2000,
        durationDay: 5
      }
    ]);

    // Use two coupon
    await Call<{}, RedeemCouponQuery>(redeem.default, {
      auth: user.manager,
      query: {
        key: coupon2[0]
      }
    });
    teamPlans = (
      await Call(getTeamPlans.default, {
        auth: user.manager
      })
    ).data;
    let formatTeamPlans = teamPlans.map((item: TeamSubSchema) => ({
      type: item.type,
      currentSubLevel: item.currentSubLevel,
      totalPoints: item.totalPoints,
      surplusPoints: item.surplusPoints,
      durationDay: dayjs(item.expiredTime).diff(dayjs(item.startTime), 'day'),
      currentExtraDatasetSize: item.currentExtraDatasetSize
    }));
    expect(formatTeamPlans).toEqual([
      {
        type: 'extraDatasetSize',
        currentSubLevel: undefined,
        totalPoints: undefined,
        surplusPoints: undefined,
        durationDay: 2,
        currentExtraDatasetSize: 1000
      },
      {
        type: 'extraPoints',
        currentSubLevel: undefined,
        totalPoints: 1000,
        surplusPoints: 1000,
        durationDay: 5,
        currentExtraDatasetSize: undefined
      },
      {
        type: 'standard',
        currentSubLevel: 'experience',
        totalPoints: 4000,
        surplusPoints: 4000,
        durationDay: 10,
        currentExtraDatasetSize: undefined
      },
      {
        type: 'extraPoints',
        currentSubLevel: undefined,
        totalPoints: 3000,
        surplusPoints: 3000,
        durationDay: 10,
        currentExtraDatasetSize: undefined
      },
      {
        type: 'extraDatasetSize',
        currentSubLevel: undefined,
        totalPoints: undefined,
        surplusPoints: undefined,
        durationDay: 10,
        currentExtraDatasetSize: 3000
      }
    ]);
  });
});
