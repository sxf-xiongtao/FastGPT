import * as updateapi from '@/pages/api/support/user/team/org/update';
import { MongoOrgModel } from '@fastgpt/service/support/permission/org/orgSchema';
import { getFakeOrgs, getFakeUsers } from '@test/datas/users';
import { Call } from '@test/utils/request';
import { describe, expect, it } from 'vitest';

describe('org update test', () => {
  it('should update org', async () => {
    const users = await getFakeUsers();
    const orgs = await getFakeOrgs();

    const res = await Call<
      updateapi.OrgUpdateBody,
      updateapi.OrgUpdateQuery,
      updateapi.OrgUpdateResponse
    >(updateapi.default, {
      auth: users.owner,
      body: {
        orgId: orgs[1]._id,
        name: 'test',
        description: 'test'
      }
    });
    expect(res.error).toBeUndefined();
    expect(res.code).toBe(200);

    const org = await MongoOrgModel.findById(orgs[1]._id);
    expect(org).toBeDefined();
    expect(org?.name).toBe('test');
    expect(org?.description).toBe('test');
  });
});
