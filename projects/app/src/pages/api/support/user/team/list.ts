import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { getUserTeams } from '@/service/support/user/team/controller';
import { TeamMemberSchema } from '@fastgpt/global/support/user/team/type';
import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
export type UserTeamListQuery = {
  status: `${TeamMemberSchema['status']}`;
};
export type UserTeamListBody = {};
export type UserTeamListResponse = Awaited<ReturnType<typeof getUserTeams>>;
async function handler(
  req: ApiRequestProps<UserTeamListBody, UserTeamListQuery>,
  res: ApiResponseType<any>
): Promise<UserTeamListResponse> {
  const { status } = req.query;
  const { userId } = await authCert({ req, authToken: true });

  return await getUserTeams({
    userId,
    status
  });
}
export default NextAPI(handler);
