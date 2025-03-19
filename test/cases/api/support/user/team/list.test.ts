import { describe, it, expect } from 'vitest';
import { Call } from '@test/utils/request';
import { getRootUser } from '@test/datas/users';
import handler from '@/pages/api/support/user/team/list';
import type {
  UserTeamListQuery,
  UserTeamListBody,
  UserTeamListResponse
} from '@/pages/api/support/user/team/list';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { getUserTeams } from '@/service/support/user/team/controller';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { TeamSchema } from '@fastgpt/global/support/user/team/type';
import { UserModelSchema } from '@fastgpt/global/support/user/type';

describe('User Team List', {}, () => {
  it('should return 200 and get user team list', async () => {
    const root = await getRootUser();
    const res = await Call<UserTeamListBody, UserTeamListQuery, UserTeamListResponse>(handler, {
      auth: root,
      query: {
        status: 'active'
      }
    });
    expect(res.code).toBe(200);
    expect(res.data).toBeDefined();
    expect(res.data.length).toBe(1);
    expect(String(res.data[0].tmbId)).toBe(String(root.tmbId));
  });
});
