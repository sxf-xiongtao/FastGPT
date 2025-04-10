import * as deleteapi from '@/pages/api/support/user/team/member/delete';
import { getFakeUsers } from '@test/datas/users';
import { Call } from '@test/utils/request';
import { vi, describe, it, expect, beforeAll } from 'vitest';
beforeAll(() => {
  vi.stubGlobal('systemConfig', {
    teamMode: 'multi'
  });
});
describe('api/support/user/team/member/count', () => {
  it('should return 200', async () => {
    const users = await getFakeUsers();
    const res = await Call<
      deleteapi.MemberDeleteBody,
      deleteapi.MemberDeleteQuery,
      deleteapi.MemberDeleteResponse
    >(deleteapi.default, {
      auth: users.owner,
      query: {
        tmbId: users.members[1].tmbId
      }
    });
    expect(res.error).toBeUndefined();
  });

  // it('only owner can delete manager', async () => {
  //   const users = await getFakeUsers();
  //   const res = await Call<
  //     deleteapi.MemberDeleteBody,
  //     deleteapi.MemberDeleteQuery,
  //     deleteapi.MemberDeleteResponse
  //   >(deleteapi.default, {
  //     auth: users.manager,
  //     query: {
  //       tmbId: users.manager.tmbId
  //     }
  //   });
  //   expect(res.error).toBe(TeamErrEnum.unAuthTeam);

  //   const res2 = await Call<
  //     deleteapi.MemberDeleteBody,
  //     deleteapi.MemberDeleteQuery,
  //     deleteapi.MemberDeleteResponse
  //   >(deleteapi.default, {
  //     auth: users.owner,
  //     query: {
  //       tmbId: users.manager.tmbId
  //     }
  //   });
  //   expect(res2.error).toBeUndefined();
  //   expect(res2.code).toBe(200);
  // });
});
