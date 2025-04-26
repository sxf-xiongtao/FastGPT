import { getFakeUsers } from '@test/datas/users';
import { Call } from '@test/utils/request';
import { describe, expect, it } from 'vitest';
import * as list from '@/pages/api/admin/support/wallet/coupon/list';
import { ERROR_ENUM } from '@fastgpt/global/common/error/errorCode';
import { type CreateCouponBody } from '@/pages/api/admin/support/wallet/coupon/create';
import * as create from '@/pages/api/admin/support/wallet/coupon/create';
import { oneCouponBody, twoCouponBody } from './mock';
import * as disable from '@/pages/api/admin/support/wallet/coupon/disable';
import { type DisableCouponBody } from '@/pages/api/admin/support/wallet/coupon/disable';
import * as redeem from '@/pages/api/support/wallet/coupon/redeem';
import { type RedeemCouponQuery } from '@/pages/api/support/wallet/coupon/redeem';
import { MongoTeamCoupon } from '@fastgpt/service/support/wallet/coupon/schema';

describe('Create, list and disable coupon', async () => {
  it('Unauth check', async () => {
    const res = await Call(list.default, {});
    expect(res.error.message).equal(ERROR_ENUM.unAuthorization);
  });

  it('List coupon', async () => {
    const user = await getFakeUsers();

    // Create one coupon
    await Call<CreateCouponBody>(create.default, {
      auth: user.manager,
      body: oneCouponBody
    });
    const res = await Call(list.default, {
      auth: user.manager
    });
    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data.length).toBe(1);

    // Create two coupon
    await Call<CreateCouponBody>(create.default, {
      auth: user.manager,
      body: twoCouponBody
    });
    const res2 = await Call(list.default, {
      auth: user.manager
    });
    expect(res2.data.length).toBe(3);

    // Disable one coupon
    await Call<DisableCouponBody>(disable.default, {
      auth: user.manager,
      body: {
        keys: res2.data[0].key
      }
    });
    const res3 = await Call(list.default, {
      auth: user.manager
    });
    expect(res3.data.length).toBe(2);
    expect(res3.data).toEqual(res2.data.slice(1));

    // Redeem one coupon
    const key = res3.data[0].key;
    await Call<{}, RedeemCouponQuery>(redeem.default, {
      auth: user.manager,
      query: {
        key
      }
    });
    const res4 = await Call(list.default, {
      auth: user.manager
    });
    expect(res4.data.length).toBe(1);
    expect(res4.data[0].key).toBe(res3.data[1].key);

    // Expired coupon
    await MongoTeamCoupon.updateOne(
      {
        key: res4.data[0].key
      },
      {
        $set: {
          expiredAt: new Date()
        }
      }
    );
    const res5 = await Call(list.default, {
      auth: user.manager
    });
    expect(res5.data.length).toBe(0);
  });
});
