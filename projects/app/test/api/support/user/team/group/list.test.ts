import * as listapi from '@/pages/api/support/user/team/group/list';
import * as updateapi from '@/pages/api/support/user/team/group/update';
import { CommonErrEnum } from '@fastgpt/global/common/error/code/common';
import { TeamErrEnum } from '@fastgpt/global/common/error/code/team';
import { getFakeGroups, getFakeUsers } from '@test/datas/users';
import { Call } from '@test/utils/request';
import { exec } from 'node:child_process';
import { describe, expect, it } from 'vitest';

describe('test group list api', () => {
  it('list groups', async () => {
    const users = await getFakeUsers();
    const groups = await getFakeGroups();
    const res = await Call<
      listapi.GroupListBody,
      listapi.GroupListQuery,
      listapi.GroupListResponse<false>
    >(listapi.default, {
      auth: users.owner
    });

    expect(res.error).toBeUndefined();
    expect(res.code).toBe(200);
    expect(res.data.length).toBe(groups.length + 1);
  });

  it('search', async () => {
    const users = await getFakeUsers();
    const groups = await getFakeGroups();
    const res = await Call<
      listapi.GroupListBody,
      listapi.GroupListQuery,
      listapi.GroupListResponse<false>
    >(listapi.default, {
      auth: users.owner,
      body: {
        searchKey: 'group1'
      }
    });

    expect(res.error).toBeUndefined();
    expect(res.code).toBe(200);
    expect(res.data.length).toBe(1);
  });

  it('withMembers', async () => {
    const users = await getFakeUsers();
    const groups = await getFakeGroups();
    const res = await Call<
      listapi.GroupListBody,
      listapi.GroupListQuery,
      listapi.GroupListResponse<true>
    >(listapi.default, {
      auth: users.owner,
      body: {
        withMembers: true
      }
    });

    expect(res.error).toBeUndefined();
    expect(res.code).toBe(200);
    expect(res.data.length).toBe(groups.length + 1);
  });

  it('withMembers', async () => {
    const users = await getFakeUsers();
    const group = await getFakeGroups(1);
    const res = await Call<
      updateapi.GroupUpdateBody,
      updateapi.GroupUpdateQuery,
      updateapi.GroupUpdateResponse
    >(updateapi.default, {
      auth: users.owner,
      body: {
        groupId: group[0]._id,
        memberList: [
          {
            tmbId: users.members[0].tmbId,
            role: 'member'
          },
          {
            tmbId: users.members[1].tmbId,
            role: 'member'
          }
        ]
      }
    });
    expect(res.error).toBeUndefined();
    expect(res.code).toBe(200);

    const res2 = await Call<
      listapi.GroupListBody,
      listapi.GroupListQuery,
      listapi.GroupListResponse<true>
    >(listapi.default, {
      auth: users.owner,
      body: {
        withMembers: true,
        searchKey: 'group1'
      }
    });
    expect(res2.error).toBeUndefined();
    expect(res2.code).toBe(200);
    expect(res2.data.length).toBe(1);
    expect(res2.data[0].name).toBe('group1');
    expect(res2.data[0].members.length).toBe(2);
  });
});
