import { CommonErrEnum } from '@fastgpt/global/common/error/code/common';
import { TeamErrEnum } from '@fastgpt/global/common/error/code/team';
import { getFakeUsers } from '@test/datas/users';
import { Call } from '@test/utils/request';
import { describe, expect, it } from 'vitest';
import { type CreateCouponBody } from '@/pages/api/admin/support/wallet/coupon/create';
import * as create from '@/pages/api/admin/support/wallet/coupon/create';
import { oneCouponBody, twoCouponBody } from './mock';
import { ERROR_ENUM } from '@fastgpt/global/common/error/errorCode';

describe('api/support/wallet/coupon/create', async () => {
  it('Unauth check', async () => {
    const res = await Call<CreateCouponBody>(create.default, {
      body: oneCouponBody
    });
    expect(res.error.message).equal(ERROR_ENUM.unAuthorization);
  });

  it('Create one coupon', async () => {
    const manager = await getFakeUsers();

    const res = await Call<CreateCouponBody>(create.default, {
      auth: manager.manager,
      body: oneCouponBody
    });

    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data.length).toBe(1);
  });

  it('Create two coupon', async () => {
    const manager = await getFakeUsers();

    const res = await Call<CreateCouponBody>(create.default, {
      auth: manager.manager,
      body: twoCouponBody
    });

    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data.length).toBe(2);
  });
});
