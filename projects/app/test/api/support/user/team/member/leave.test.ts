import * as leaveapi from '@/pages/api/support/user/team/member/leave';
import { getFakeUsers } from '@test/datas/users';
import { Call } from '@test/utils/request';
import { vi, describe, it, expect, beforeAll } from 'vitest';

beforeAll(() => {
  vi.stubGlobal('systemConfig', {
    teamMode: 'multi'
  });
});

describe('api/support/user/team/member/leave', () => {
  it('member can leave', async () => {
    const users = await getFakeUsers();
    const res = await Call(leaveapi.default, {
      auth: users.members[0]
    });
    expect(res.error).toBeUndefined();
    expect(res.code).toBe(200);
  });
});
