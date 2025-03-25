import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { parsePaginationRequest } from '@fastgpt/service/common/api/pagination';
import { PaginationResponse } from '@fastgpt/web/common/fetch/type';
import { TeamMemberItemType } from '@fastgpt/global/support/user/team/type';
import { getTeamMembersPaged } from '@/service/support/user/team/controller';

export type GetOrgMembersQuery = {
  orgId: string;
};
export type GetOrgMembersBody = {};
export type GetOrgMembersResponse = PaginationResponse<TeamMemberItemType>;

async function handler(
  req: ApiRequestProps<GetOrgMembersBody, GetOrgMembersQuery>,
  res: ApiResponseType<any>
): Promise<GetOrgMembersResponse> {
  const { teamId } = await authCert({ req, authToken: true });
  const { offset, pageSize } = parsePaginationRequest(req);
  const { orgId } = req.query;

  if (!orgId) {
    return {
      list: [],
      total: 0
    };
  }

  return getTeamMembersPaged({
    offset,
    pageSize,
    teamId,
    orgId,
    withLeaved: false
  });
}
export default NextAPI(handler);
