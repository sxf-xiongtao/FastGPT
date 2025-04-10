import * as update from '@/pages/api/support/user/team/group/update';
import * as create from '@/pages/api/support/user/team/group/create';
import { MongoGroupMemberModel } from '@fastgpt/service/support/permission/memberGroup/groupMemberSchema';
import { getFakeUsers } from '@test/datas/users';
import { Call } from '@test/utils/request';
import { describe, expect, it, vi } from 'vitest';
import '@test/mocks/request';

describe('api/support/user/team/group/update', async () => {
  it('update basic info', async () => {
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

    const updateRes = await Call<
      update.GroupUpdateBody,
      update.GroupUpdateQuery,
      update.GroupUpdateResponse
    >(update.default, {
      auth: users.owner,
      body: {
        name: 'test2',
        avatar: 'test2',
        groupId: gm.groupId
      }
    });
    expect(updateRes.error).toBeUndefined();
    expect(updateRes.code).toBe(200);
  });
  it('update members', async () => {
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

    const updateRes = await Call<
      update.GroupUpdateBody,
      update.GroupUpdateQuery,
      update.GroupUpdateResponse
    >(update.default, {
      auth: users.owner,
      body: {
        groupId: gm.groupId,
        memberList: [
          {
            tmbId: users.members[0].tmbId,
            role: 'admin'
          },
          {
            tmbId: users.members[1].tmbId,
            role: 'member'
          }
        ]
      }
    });
    expect(updateRes.error).toBeUndefined();
    expect(updateRes.code).toBe(200);
  });
});
