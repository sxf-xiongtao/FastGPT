import * as leaveapi from '@/pages/api/support/user/team/member/leave';
import { delay } from '@fastgpt/global/common/system/utils';
import { getFakeUsers } from '@test/datas/users';
import { Call } from '@test/utils/request';
import { vi, describe, it, expect, beforeAll } from 'vitest';

describe('api/support/user/team/member/leave', () => {
  it('member can leave', async () => {
    vi.stubGlobal('systemConfig', {
      teamMode: 'multi'
    });
    const users = await getFakeUsers(1);
    const res = await Call(leaveapi.default, {
      auth: users.members[0]
    });
    expect(res.error).toBeUndefined();
    expect(res.code).toBe(200);
  });
});
