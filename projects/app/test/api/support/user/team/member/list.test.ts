import * as listapi from '@/pages/api/support/user/team/member/list';
import { MongoGroupMemberModel } from '@fastgpt/service/support/permission/memberGroup/groupMemberSchema';
import { MongoOrgMemberModel } from '@fastgpt/service/support/permission/org/orgMemberSchema';
import { MongoOrgModel } from '@fastgpt/service/support/permission/org/orgSchema';
import { getFakeGroups, getFakeOrgs, getFakeUsers } from '@test/datas/users';
import { Call } from '@test/utils/request';
import { describe, it, expect } from 'vitest';

describe('list api', () => {
  it('should return 200', async () => {
    const users = await getFakeUsers();
    const res = await Call<
      listapi.MemberListBody,
      listapi.MemberListQuery,
      listapi.MemberListResponse
    >(listapi.default, {
      auth: users.members[0],
      body: {
        pageSize: 10,
        offset: 0
      }
    });
    expect(res.error).toBeUndefined();
    expect(res.code).toBe(200);
    expect(res.data.list.length).toBe(10);
  });
  it('search', async () => {
    const users = await getFakeUsers();
    const res = await Call<
      listapi.MemberListBody,
      listapi.MemberListQuery,
      listapi.MemberListResponse
    >(listapi.default, {
      auth: users.members[0],
      body: {
        pageSize: 10,
        offset: 0,
        searchKey: 'member1',
        withOrgs: true,
        withPermission: true
      }
    });
    expect(res.error).toBeUndefined();
    expect(res.code).toBe(200);
    expect(res.data.list.length).toBe(2);
  });
  it('orgid filter', async () => {
    const users = await getFakeUsers();
    const orgs = await getFakeOrgs();
    await MongoOrgMemberModel.create([
      {
        teamId: users.members[0].teamId,
        orgId: orgs[0]._id,
        tmbId: users.members[0].tmbId
      },
      {
        teamId: users.members[0].teamId,
        orgId: orgs[0]._id,
        tmbId: users.members[1].tmbId
      },
      {
        teamId: users.members[0].teamId,
        orgId: orgs[0]._id,
        tmbId: users.members[2].tmbId
      }
    ]);
    const res = await Call<
      listapi.MemberListBody,
      listapi.MemberListQuery,
      listapi.MemberListResponse
    >(listapi.default, {
      auth: users.members[0],
      body: {
        pageSize: 10,
        offset: 0,
        orgId: orgs[0]._id
      }
    });
    expect(res.error).toBeUndefined();
    expect(res.code).toBe(200);
    expect(res.data.list.length).toBe(3);
  });
  it('group filter', async () => {
    const users = await getFakeUsers();
    const groups = await getFakeGroups(2);
    await MongoGroupMemberModel.create([
      {
        teamId: users.members[0].teamId,
        groupId: groups[0]._id,
        tmbId: users.members[0].tmbId
      },
      {
        teamId: users.members[0].teamId,
        groupId: groups[0]._id,
        tmbId: users.members[1].tmbId
      },
      {
        teamId: users.members[0].teamId,
        groupId: groups[1]._id,
        tmbId: users.members[2].tmbId
      }
    ]);
    const res = await Call<
      listapi.MemberListBody,
      listapi.MemberListQuery,
      listapi.MemberListResponse
    >(listapi.default, {
      auth: users.members[0],
      body: {
        pageSize: 10,
        offset: 0,
        groupId: groups[0]._id
      }
    });
    expect(res.error).toBeUndefined();
    expect(res.code).toBe(200);
    expect(res.data.list.length).toBe(2);
  });
});
