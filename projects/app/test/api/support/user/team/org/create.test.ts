import * as createapi from '@/pages/api/support/user/team/org/create';
import * as listapi from '@/pages/api/support/user/team/org/list';
import { getRootOrg } from '@/service/support/user/team/org/utils';
import { MongoResourcePermission } from '@fastgpt/service/support/permission/schema';
import { getFakeUsers } from '@test/datas/users';
import { Call } from '@test/utils/request';
import { describe, expect, it } from 'vitest';

describe('create', () => {
  it('should return 200 when create team succeeds', async () => {
    const users = await getFakeUsers();
    const root = await getRootOrg({ teamId: users.owner.teamId });
    const res = await Call<
      createapi.OrgCreateBody,
      createapi.OrgCreateQuery,
      createapi.OrgCreateResponse
    >(createapi.default, {
      auth: users.manager,
      body: {
        name: 'test',
        description: 'test',
        orgId: root._id
      }
    });
    expect(res.error).toBeUndefined();
    expect(res.code).toBe(200);

    const res2 = await Call<listapi.OrgListBody, listapi.OrgListQuery, listapi.OrgListResponse>(
      listapi.default,
      {
        auth: users.members[0],
        body: {
          orgId: ''
        }
      }
    );
    expect(res2.error).toBeUndefined();
    expect(res2.code).toBe(200);
    expect(res2.data.length).toBe(1);
  });
});
