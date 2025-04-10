import * as updateNamebyManagerapi from '@/pages/api/support/user/team/member/updateNameByManager';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { getFakeUsers } from '@test/datas/users';
import { Call } from '@test/utils/request';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { CommonErrEnum } from '@fastgpt/global/common/error/code/common';

describe('updateNameByManager api', () => {
  it('updateNameByManager', async () => {
    const users = await getFakeUsers();
    const res = await Call(updateNamebyManagerapi.default, {
      auth: users.owner,
      body: {
        tmbId: users.members[0].tmbId,
        name: 'test'
      }
    });
    expect(res.error).toBeUndefined();
    expect(res.code).toBe(200);

    const tmb = await MongoTeamMember.findById(users.members[0].tmbId).lean();
    expect(tmb?.name).toBe('test');
  });
});
