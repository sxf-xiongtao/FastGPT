import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { parsePaginationRequest } from '@fastgpt/service/common/api/pagination';
import { PaginationResponse } from '@fastgpt/web/common/fetch/type';
import { TeamMemberItemType } from '@fastgpt/global/support/user/team/type';
import { getTeamMembersPaged } from '@/service/support/user/team/controller';
import { MongoOrgModel } from '@fastgpt/service/support/permission/org/orgSchema';
import { getRootOrg } from '@/service/support/user/team/org/utils';

export type GetOrgMembersQuery = {
  orgPath?: string;
};
export type GetOrgMembersBody = {};
export type GetOrgMembersResponse = PaginationResponse<TeamMemberItemType>;

async function handler(
  req: ApiRequestProps<GetOrgMembersBody, GetOrgMembersQuery>,
  res: ApiResponseType<any>
): Promise<GetOrgMembersResponse> {
  const { teamId } = await authCert({ req, authToken: true });
  const { offset, pageSize } = parsePaginationRequest(req);
  const { orgPath: path = '' } = req.query;
  const orgId = await (async () => {
    if (path === '') {
      // get root's members
      const rootOrg = await getRootOrg({ teamId });
      return rootOrg._id;
    } else {
      const pathId = path.split('/').at(-1);
      return (await MongoOrgModel.findOne({ pathId }).lean())?._id;
    }
  })();

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
