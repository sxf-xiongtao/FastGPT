import listHandler from '@/pages/api/support/user/team/collaborator/list';
import type * as ListTypes from '@/pages/api/support/user/team/collaborator/list';
import updateHandler from '@/pages/api/support/user/team/collaborator/update';
import type * as UpdateTypes from '@/pages/api/support/user/team/collaborator/update';
import { TeamReadPermissionVal } from '@fastgpt/global/support/permission/user/constant';

import { getFakeGroups, getFakeOrgs, getFakeUsers } from '@test/datas/users';
import { Call } from '@test/utils/request';
import { describe, expect, it } from 'vitest';

describe('team collaborator list', () => {
  it('should return collaborator list', async () => {
    const users = await getFakeUsers();
    const groups = await getFakeGroups();
    const orgs = await getFakeOrgs();
    // create some collaborators
    const res1 = await Call<
      UpdateTypes.UpdatePermissionBody,
      UpdateTypes.UpdatePermissionQuery,
      UpdateTypes.UpdatePermissionResponse
    >(updateHandler, {
      auth: users.owner,
      body: {
        members: [users.members[0].tmbId, users.members[1].tmbId],
        groups: [groups[0]._id, groups[1]._id],
        orgs: [orgs[0]._id, orgs[1]._id],
        permission: TeamReadPermissionVal
      }
    });
    expect(res1.error).toBeUndefined();
    expect(res1.code).toBe(200);
    const res = await Call<ListTypes.TeamClbsListResponse>(listHandler, {
      auth: users.members[0]
    });
    expect(res.error).toBeUndefined();
    expect(res.code).toBe(200);
    expect(res.data.length).toBe(7);
  });
});
