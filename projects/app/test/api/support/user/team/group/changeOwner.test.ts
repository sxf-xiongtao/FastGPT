import * as changeOwner from '@/pages/api/support/user/team/group/changeOwner';
import * as create from '@/pages/api/support/user/team/group/create';
import { MongoGroupMemberModel } from '@fastgpt/service/support/permission/memberGroup/groupMemberSchema';
import { getFakeUsers } from '@test/datas/users';
import { Call } from '@test/utils/request';
import { describe, expect, it, vi } from 'vitest';
import '@test/mocks/request';

describe('api/support/user/team/group/changeOwner', async () => {
  it('should return 200', async () => {
    const users = await getFakeUsers();
    // prepare a group
    const createRes = await Call<
      create.GroupCreateBody,
      create.GroupCreateQuery,
      create.GroupCreateResponse
    >(create.default, {
      auth: users.manager,
      body: {
        name: 'test',
        avatar: 'test'
      }
    });
    expect(createRes.error).toBeUndefined();
    expect(createRes.code).toBe(200);
    const gm = await MongoGroupMemberModel.findOne({
      tmbId: users.manager.tmbId
    }).lean();
    const changeOwnerRes = await Call<
      changeOwner.GroupChangeOwnerBody,
      changeOwner.GroupChangeOwnerQuery,
      changeOwner.GroupChangeOwnerResponse
    >(changeOwner.default, {
      auth: users.owner,
      body: {
        tmbId: users.members[0].tmbId,
        groupId: gm.groupId
      }
    });
    expect(changeOwnerRes.error).toBeUndefined();
    expect(changeOwnerRes.code).toBe(200);
  });
});
