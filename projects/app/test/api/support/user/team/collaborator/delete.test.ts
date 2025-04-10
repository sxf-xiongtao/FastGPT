import updateHandler from '@/pages/api/support/user/team/collaborator/update';
import * as UpdateTypes from '@/pages/api/support/user/team/collaborator/update';
import deleteHandler from '@/pages/api/support/user/team/collaborator/delete';
import * as DeleteTypes from '@/pages/api/support/user/team/collaborator/delete';
import {
  TeamManagePermissionVal,
  TeamReadPermissionVal
} from '@fastgpt/global/support/permission/user/constant';

import { getFakeUsers } from '@test/datas/users';
import { Call } from '@test/utils/request';
import { describe, expect, it } from 'vitest';
import { CommonErrEnum } from '@fastgpt/global/common/error/code/common';
import { TeamErrEnum } from '@fastgpt/global/common/error/code/team';

describe('team collaborator list', () => {
  it('only owner/manager can delete', async () => {
    const users = await getFakeUsers();
    // prepare a manager
    const res = await Call<UpdateTypes.UpdatePermissionResponse>(updateHandler, {
      auth: users.owner,
      body: {
        members: [users.members[0].tmbId, users.members[1].tmbId],
        permission: TeamManagePermissionVal
      }
    });
    expect(res.error).toBeUndefined();
    expect(res.code).toBe(200);
    // prepare some read permission
    const res2 = await Call<UpdateTypes.UpdatePermissionResponse>(updateHandler, {
      auth: users.owner,
      body: {
        members: [users.members[2].tmbId, users.members[3].tmbId],
        permission: TeamReadPermissionVal
      }
    });
    expect(res2.error).toBeUndefined();
    expect(res2.code).toBe(200);

    // delete, no param
    const res3 = await Call<
      DeleteTypes.removeBody,
      DeleteTypes.removeQuery,
      DeleteTypes.removeResponse
    >(deleteHandler, {
      auth: users.members[1]
    });
    expect(res3.error).toBe(CommonErrEnum.missingParams);
    expect(res3.code).toBe(500);

    // manage delete read perm
    const res4 = await Call<
      DeleteTypes.removeBody,
      DeleteTypes.removeQuery,
      DeleteTypes.removeResponse
    >(deleteHandler, {
      auth: users.owner,
      query: {
        tmbId: users.members[2].tmbId
      }
    });
    expect(res4.error).toBeUndefined();
    expect(res4.code).toBe(200);

    // manager can not delete manager
    const res5 = await Call<
      DeleteTypes.removeBody,
      DeleteTypes.removeQuery,
      DeleteTypes.removeResponse
    >(deleteHandler, {
      auth: users.members[0],
      query: {
        tmbId: users.members[1].tmbId
      }
    });
    expect(res5.error).toBe(TeamErrEnum.unAuthTeam);
    expect(res5.code).toBe(500);

    // owner can delete manager
    const res6 = await Call<
      DeleteTypes.removeBody,
      DeleteTypes.removeQuery,
      DeleteTypes.removeResponse
    >(deleteHandler, {
      auth: users.owner,
      query: {
        tmbId: users.members[1].tmbId
      }
    });
    expect(res6.error).toBeUndefined();
    expect(res6.code).toBe(200);
  });
});
