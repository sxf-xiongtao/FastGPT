import { NextAPI } from '@/service/middleware/entry';
import { getRootOrg } from '@/service/support/user/team/org/utils';
import type { putUpdateOrgMembersData } from '@fastgpt/global/support/user/team/org/api';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import { authOrgMember } from '@fastgpt/service/support/permission/auth/org';
import { MongoOrgMemberModel } from '@fastgpt/service/support/permission/org/orgMemberSchema';
import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';

export type OrgUpdateMembersQuery = {};
export type OrgUpdateMembersBody = putUpdateOrgMembersData;
export type OrgUpdateMembersResponse = undefined;

/*
  传入所有的 members，全量更新
*/
async function handler(
  req: ApiRequestProps<OrgUpdateMembersBody, OrgUpdateMembersQuery>,
  _res: ApiResponseType<any>
): Promise<OrgUpdateMembersResponse> {
  const { orgId: _orgId } = req.body;
  let { members } = req.body;
  const { teamId } = await authOrgMember({
    req,
    authToken: true
  });
  const orgId = _orgId || (await getRootOrg({ teamId }))._id;

  await mongoSessionRun(async (session) => {
    await MongoOrgMemberModel.deleteMany({ teamId, orgId }, { session });
    await MongoOrgMemberModel.create(
      members.map((item) => ({
        teamId,
        orgId,
        tmbId: item.tmbId
      })),
      { session, ordered: true }
    );
  });
}

export default NextAPI(handler);
