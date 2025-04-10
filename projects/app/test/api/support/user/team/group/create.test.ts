import * as create from '@/pages/api/support/user/team/group/create';
import { CommonErrEnum } from '@fastgpt/global/common/error/code/common';
import { TeamErrEnum } from '@fastgpt/global/common/error/code/team';
import { getFakeUsers } from '@test/datas/users';
import { Call } from '@test/utils/request';
import { describe, expect, it } from 'vitest';

describe('api/support/user/team/group/create', async () => {
  it('should return 200', async () => {
    const users = await getFakeUsers();
    const res = await Call<
      create.GroupCreateBody,
      create.GroupCreateQuery,
      create.GroupCreateResponse
    >(create.default, {
      auth: users.manager,
      body: {
        name: 'test',
        avatar: 'test'
      }
    });
    expect(res.error).toBeUndefined();
    expect(res.code).toBe(200);
    const res2 = await Call<
      create.GroupCreateBody,
      create.GroupCreateQuery,
      create.GroupCreateResponse
    >(create.default, {
      auth: users.manager
    });
    expect(res2.error).toBe(TeamErrEnum.groupNameEmpty);
    expect(res2.code).toBe(500);

    const res3 = await Call<
      create.GroupCreateBody,
      create.GroupCreateQuery,
      create.GroupCreateResponse
    >(create.default, {
      auth: users.manager,
      body: {
        name: 'test',
        avatar: 'test'
      }
    });
    expect(res3.error).toBe(TeamErrEnum.groupNameDuplicate);
    expect(res3.code).toBe(500);
  });
});
