import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { PaginationProps, PaginationResponse } from '@fastgpt/web/common/fetch/type';
import { getTeamMembersPaged } from '@/service/support/user/team/controller';
import { TeamMemberItemType } from '@fastgpt/global/support/user/team/type';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { parsePaginationRequest } from '@fastgpt/service/common/api/pagination';

export type MemberListQuery = PaginationProps<{
  withLeaved?: 'true' | 'false';
}>;
export type MemberListBody = {};
export type MemberListResponse = PaginationResponse<TeamMemberItemType>;

async function handler(
  req: ApiRequestProps<MemberListBody, MemberListQuery>,
  _res: ApiResponseType<any>
): Promise<MemberListResponse> {
  const { teamId } = await authCert({ req, authToken: true });
  const { offset, pageSize } = parsePaginationRequest(req);
  const { withLeaved } = req.query;

  return getTeamMembersPaged({
    teamId,
    offset,
    pageSize,
    withLeaved: withLeaved === 'true'
  });
}
export default NextAPI(handler);
