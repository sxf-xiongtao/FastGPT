import * as deleteapi from '@/pages/api/support/user/team/org/delete';
import * as listapi from '@/pages/api/support/user/team/org/list';
import { getFakeOrgs, getFakeUsers } from '@test/datas/users';
import { Call } from '@test/utils/request';
import { describe, it, expect } from 'vitest';

describe('delete api', () => {
  it('should return 200 when delete team org success', async () => {
    const users = await getFakeUsers(1);
    const orgs = await getFakeOrgs();
    const res = await Call<
      deleteapi.OrgDeleteBody,
      deleteapi.OrgDeleteQuery,
      deleteapi.OrgDeleteResponse
    >(deleteapi.default, {
      auth: users.owner,
      query: {
        orgId: orgs[2]._id
      }
    });
    expect(res.error).toBeUndefined();
    expect(res.code).toBe(200);

    const res2 = await Call<listapi.OrgListBody, listapi.OrgListQuery, listapi.OrgListResponse>(
      listapi.default,
      {
        auth: users.owner,
        body: {
          orgId: orgs[0]._id
        }
      }
    );
    expect(res2.error).toBeUndefined();
    expect(res2.code).toBe(200);
    expect(res2.data.length).toBe(2);
  });
});
