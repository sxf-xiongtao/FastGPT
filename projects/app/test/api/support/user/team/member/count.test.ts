import * as countapi from '@/pages/api/support/user/team/member/count';
import { getFakeUsers } from '@test/datas/users';
import { Call } from '@test/utils/request';
import { describe, it, expect } from 'vitest';

describe('api/support/user/team/member/count', () => {
  it('should return 200', async () => {
    const users = await getFakeUsers();
    const res = await Call<countapi.MemberCountResponse>(countapi.default, {
      auth: users.members[0]
    });
    expect(res.error).toBeUndefined();
    expect(res.data.count).toBe(users.members.length + 2);
  });
});
