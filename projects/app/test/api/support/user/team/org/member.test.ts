import * as deleteMemberapi from '@/pages/api/support/user/team/org/deleteMember';
import * as updatememberapi from '@/pages/api/support/user/team/org/updateMembers';
import { getFakeOrgs, getFakeUsers } from '@test/datas/users';
import { Call } from '@test/utils/request';
import { describe, expect, it } from 'vitest';

describe('org member test', () => {
  it('should delete member', async () => {
    const users = await getFakeUsers();
    const orgs = await getFakeOrgs();

    // add member
    const res = await Call<
      updatememberapi.OrgUpdateMembersBody,
      updatememberapi.OrgUpdateMembersQuery,
      updatememberapi.OrgUpdateMembersResponse
    >(updatememberapi.default, {
      auth: users.owner,
      body: {
        orgId: orgs[0]._id,
        members: [{ tmbId: users.members[0].tmbId }, { tmbId: users.members[1].tmbId }]
      }
    });
    expect(res.error).toBeUndefined();
    expect(res.code).toBe(200);

    // delete member
    const res2 = await Call<
      deleteMemberapi.OrgDeleteMemberBody,
      deleteMemberapi.OrgDeleteMemberQuery,
      deleteMemberapi.OrgDeleteMemberResponse
    >(deleteMemberapi.default, {
      auth: users.owner,
      query: {
        orgId: orgs[0]._id,
        tmbId: users.members[0].tmbId
      }
    });
    expect(res2.error).toBeUndefined();
    expect(res2.code).toBe(200);
  });
});
