import updateHandler from '@/pages/api/support/user/team/collaborator/update';
import * as UpdateTypes from '@/pages/api/support/user/team/collaborator/update';
import { CommonErrEnum } from '@fastgpt/global/common/error/code/common';
import { TeamErrEnum } from '@fastgpt/global/common/error/code/team';
import {
  TeamManagePermissionVal,
  TeamReadPermissionVal
} from '@fastgpt/global/support/permission/user/constant';
import { MongoResourcePermission } from '@fastgpt/service/support/permission/schema';

import { getFakeGroups, getFakeUsers } from '@test/datas/users';
import { Call } from '@test/utils/request';
import { describe, expect, it } from 'vitest';

describe('team collaborator update', () => {
  it('nothing is passed', async () => {
    const owner = (await getFakeUsers()).owner;
    const res = await Call<UpdateTypes.UpdatePermissionResponse>(updateHandler, {
      auth: owner
    });
    expect(res.error).toBe(CommonErrEnum.missingParams);
    expect(res.code).toBe(500);
  });
  it('no permission passed', async () => {
    const users = await getFakeUsers();
    const groups = await getFakeGroups();
    const res = await Call<UpdateTypes.UpdatePermissionResponse>(updateHandler, {
      auth: users.owner,
      body: {
        members: [users.members[0].tmbId, users.members[1].tmbId],
        groups: [groups[0]._id, groups[1]._id]
      }
    });
    const rp = await MongoResourcePermission.find({
      resourceType: 'team',
      teamId: users.owner.teamId,
      resourceId: null,
      tmbId: users.members[0].tmbId
    });
    expect(res.error).toBeUndefined();
    expect(res.code).toBe(200);
    expect(rp.length).toBe(1);
    expect(rp[0].permission).toBe(TeamReadPermissionVal);
  });
  it('normal user can not update', async () => {
    const users = await getFakeUsers();
    const res = await Call<UpdateTypes.UpdatePermissionResponse>(updateHandler, {
      auth: users.members[0],
      body: {
        members: [users.members[0].tmbId, users.members[1].tmbId]
      }
    });
    expect(res.error).toBe(TeamErrEnum.unAuthTeam);
    expect(res.code).toBe(500);
  });
  it('manager can not update manage per', async () => {
    const users = await getFakeUsers();
    // prepare manager
    const res = await Call<UpdateTypes.UpdatePermissionResponse>(updateHandler, {
      auth: users.owner,
      body: {
        members: [users.members[0].tmbId, users.members[1].tmbId],
        permission: TeamManagePermissionVal
      }
    });
    expect(res.error).toBeUndefined();
    expect(res.code).toBe(200);
    // update
    const res2 = await Call<UpdateTypes.UpdatePermissionResponse>(updateHandler, {
      auth: users.members[0],
      body: {
        members: [users.members[1].tmbId],
        permission: TeamReadPermissionVal
      }
    });
    expect(res2.error).toBe(TeamErrEnum.unAuthTeam);
    expect(res2.code).toBe(500);

    const res3 = await Call<UpdateTypes.UpdatePermissionResponse>(updateHandler, {
      auth: users.members[1],
      body: {
        members: [users.members[0].tmbId],
        permission: TeamReadPermissionVal
      }
    });
    expect(res3.error).toBe(TeamErrEnum.unAuthTeam);
    expect(res3.code).toBe(500);
  });
  it('manager can update manage per', async () => {
    const users = await getFakeUsers();
    // prepare manager
    const res = await Call<UpdateTypes.UpdatePermissionResponse>(updateHandler, {
      auth: users.owner,
      body: {
        members: [users.members[0].tmbId, users.members[1].tmbId],
        permission: TeamManagePermissionVal
      }
    });
    expect(res.error).toBeUndefined();
    expect(res.code).toBe(200);
    // update
    const res2 = await Call<UpdateTypes.UpdatePermissionResponse>(updateHandler, {
      auth: users.members[0],
      body: {
        members: [users.members[4].tmbId],
        permission: TeamManagePermissionVal
      }
    });
    expect(res2.error).toBe(TeamErrEnum.unAuthTeam);
    expect(res2.code).toBe(500);
  });
});
