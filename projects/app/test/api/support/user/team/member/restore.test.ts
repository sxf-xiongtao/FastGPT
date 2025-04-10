import * as restoreapi from '@/pages/api/support/user/team/member/restore';
import * as deleteapi from '@/pages/api/support/user/team/member/delete';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { getFakeUsers } from '@test/datas/users';
import { Call } from '@test/utils/request';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { TeamErrEnum } from '@fastgpt/global/common/error/code/team';
import { CommonErrEnum } from '@fastgpt/global/common/error/code/common';
beforeAll(() => {
  vi.stubGlobal('systemConfig', {
    teamMode: 'sync'
  });
});
describe('restore api', () => {
  it('restore', async () => {
    const users = await getFakeUsers();
    const res = await Call<
      deleteapi.MemberDeleteBody,
      deleteapi.MemberDeleteQuery,
      deleteapi.MemberDeleteResponse
    >(deleteapi.default, {
      auth: users.owner,
      query: {
        tmbId: users.members[0].tmbId
      }
    });
    expect(res.error).toBeUndefined();
    expect(res.code).toBe(200);

    const tmb = await MongoTeamMember.findById(users.members[0].tmbId).lean();
    expect(tmb.status).toBe('forbidden');

    const res2 = await Call<
      restoreapi.MemberRestoreBody,
      restoreapi.MemberRestoreQuery,
      restoreapi.MemberRestoreResponse
    >(restoreapi.default, {
      auth: users.owner,
      body: {
        tmbId: users.members[0].tmbId
      }
    });
    expect(res2.error).toBeUndefined();
    expect(res2.code).toBe(200);

    const tmb2 = await MongoTeamMember.findById(users.members[0].tmbId).lean();
    expect(tmb2.status).toBe('active');
  });

  it('only manager can restore', async () => {
    const users = await getFakeUsers();
    const res = await Call<
      restoreapi.MemberRestoreBody,
      restoreapi.MemberRestoreQuery,
      restoreapi.MemberRestoreResponse
    >(restoreapi.default, {
      auth: users.members[0],
      body: {
        tmbId: users.members[0].tmbId
      }
    });
    expect(res.error).toBe(TeamErrEnum.unAuthTeam);
    expect(res.code).toBe(500);

    const res2 = await Call<
      restoreapi.MemberRestoreBody,
      restoreapi.MemberRestoreQuery,
      restoreapi.MemberRestoreResponse
    >(restoreapi.default, {
      auth: users.owner,
      body: {} as any
    });
    expect(res2.error).toBe(CommonErrEnum.missingParams);
    expect(res2.code).toBe(500);
  });
});
