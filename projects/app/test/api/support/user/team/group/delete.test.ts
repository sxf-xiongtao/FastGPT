import * as deleteapi from '@/pages/api/support/user/team/group/delete';
import { CommonErrEnum } from '@fastgpt/global/common/error/code/common';
import { TeamErrEnum } from '@fastgpt/global/common/error/code/team';
import { getTeamDefaultGroup } from '@fastgpt/service/support/permission/memberGroup/controllers';
import { getFakeGroups, getFakeUsers } from '@test/datas/users';
import { Call } from '@test/utils/request';
import { describe, expect, it } from 'vitest';

describe('test group delete api', () => {
  it('delete a group', async () => {
    const users = await getFakeUsers();
    const groups = await getFakeGroups();
    const res = await Call<
      deleteapi.GroupDeleteBody,
      deleteapi.GroupDeleteQuery,
      deleteapi.GroupDeleteResponse
    >(deleteapi.default, {
      auth: users.owner,
      query: {
        groupId: groups[0]._id
      }
    });

    expect(res.error).toBeUndefined();
    expect(res.code).toBe(200);

    const res2 = await Call<
      deleteapi.GroupDeleteBody,
      deleteapi.GroupDeleteQuery,
      deleteapi.GroupDeleteResponse
    >(deleteapi.default, {
      auth: users.owner,
      query: {
        groupId: groups[0]._id
      }
    });

    expect(res2.error).toBe(TeamErrEnum.groupNotExist);
    expect(res2.code).toBe(500);
  });

  it('delete a group without groupid', async () => {
    const users = await getFakeUsers();
    const res = await Call<
      deleteapi.GroupDeleteBody,
      deleteapi.GroupDeleteQuery,
      deleteapi.GroupDeleteResponse
    >(deleteapi.default, {
      auth: users.owner,
      query: {
        groupId: ''
      }
    });

    expect(res.error).toBe(CommonErrEnum.missingParams);
    expect(res.code).toBe(500);
  });

  it('can not delete the default group', async () => {
    const users = await getFakeUsers();
    // get default group
    const group = await getTeamDefaultGroup({
      teamId: users.owner.teamId
    });
    const res = await Call<
      deleteapi.GroupDeleteBody,
      deleteapi.GroupDeleteQuery,
      deleteapi.GroupDeleteResponse
    >(deleteapi.default, {
      auth: users.owner,
      query: {
        groupId: group._id
      }
    });

    expect(res.error).toBe(TeamErrEnum.cannotDeleteDefaultGroup);
    expect(res.code).toBe(500);
  });
});
