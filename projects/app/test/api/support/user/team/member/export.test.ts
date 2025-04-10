import * as exportapi from '@/pages/api/support/user/team/member/export';
import { TeamErrEnum } from '@fastgpt/global/common/error/code/team';
import { MongoOrgMemberModel } from '@fastgpt/service/support/permission/org/orgMemberSchema';
import { getFakeOrgs, getFakeUsers } from '@test/datas/users';
import { Call } from '@test/utils/request';
import { vi, describe, it, expect } from 'vitest';

describe('api/support/user/team/member/export', () => {
  it('manager cannot export', async () => {
    const users = await getFakeUsers();
    const orgs = await getFakeOrgs();
    await MongoOrgMemberModel.create({
      teamId: users.owner.teamId,
      tmbId: users.members[0].tmbId,
      orgId: orgs[0]._id
    });
    const res = await Call<
      exportapi.TeamMemberExportBody,
      exportapi.TeamMemberExportQuery,
      exportapi.TeamMemberExportResponse
    >(exportapi.default, {
      auth: users.manager,
      query: {
        tmbId: users.members[1].tmbId
      }
    });
    expect(res.error).toBe(TeamErrEnum.unAuthTeam);

    const res2 = await Call<
      exportapi.TeamMemberExportBody,
      exportapi.TeamMemberExportQuery,
      exportapi.TeamMemberExportResponse
    >(exportapi.default, {
      auth: users.owner,
      query: {
        tmbId: users.members[1].tmbId
      }
    });
    expect(res2.error).toBeUndefined();
    expect(res2.code).toBe(200);
    expect(res2.raw).toBeDefined();
    expect(res2.raw.split('\n').length).toBe(3 + users.members.length);
  });
});
