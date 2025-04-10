import * as moveapi from '@/pages/api/support/user/team/org/move';
import { MongoOrgModel } from '@fastgpt/service/support/permission/org/orgSchema';
import { getFakeOrgs, getFakeUsers } from '@test/datas/users';
import { Call } from '@test/utils/request';
import { describe, expect, it } from 'vitest';

describe('org move test', () => {
  it('should move org', async () => {
    const users = await getFakeUsers();
    const orgs = await getFakeOrgs();
    expect(orgs[5].path).toBe('/root/org1/org4');

    const res = await Call<moveapi.OrgMoveBody, moveapi.OrgMoveQuery, moveapi.OrgMoveResponse>(
      moveapi.default,
      {
        auth: users.owner,
        body: {
          orgId: orgs[1]._id,
          targetOrgId: orgs[2]._id
        }
      }
    );
    expect(res.error).toBeUndefined();
    expect(res.code).toBe(200);

    const org = await MongoOrgModel.findById(orgs[5]._id);
    expect(org).toBeDefined();
    expect(org?.path).toBe('/root/org2/org1/org4');
  });
});
