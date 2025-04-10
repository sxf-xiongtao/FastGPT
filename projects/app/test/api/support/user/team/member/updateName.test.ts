import * as updateNameapi from '@/pages/api/support/user/team/member/updateName';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { getFakeUsers } from '@test/datas/users';
import { Call } from '@test/utils/request';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { CommonErrEnum } from '@fastgpt/global/common/error/code/common';

describe('updateName api', () => {
  it('updateName', async () => {
    const users = await getFakeUsers();
    const res = await Call(updateNameapi.default, {
      auth: users.members[0],
      body: {
        name: 'test'
      }
    });
    expect(res.error).toBeUndefined();
    expect(res.code).toBe(200);

    const tmb = await MongoTeamMember.findById(users.members[0].tmbId).lean();
    expect(tmb?.name).toBe('test');
  });
  it('empty name', async () => {
    const users = await getFakeUsers();
    const res = await Call(updateNameapi.default, {
      auth: users.members[0],
      body: {
        name: ''
      }
    });
    expect(res.error).toBe(CommonErrEnum.missingParams);
    expect(res.code).toBe(500);
  });
});
