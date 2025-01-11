import { NextAPI } from '@/service/middleware/entry';
import { CommonErrEnum } from '@fastgpt/global/common/error/code/common';
import { TeamErrEnum } from '@fastgpt/global/common/error/code/team';
import { MongoOrgMemberModel } from '@fastgpt/service/support/permission/org/orgMemberSchema';
import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { authOrgMember } from '@fastgpt/service/support/permission/auth/org';

export type OrgDeleteMemberQuery = {
  orgId: string;
  tmbId: string;
};
export type OrgDeleteMemberBody = {};
export type OrgDeleteMemberResponse = {};

async function handler(
  req: ApiRequestProps<OrgDeleteMemberBody, OrgDeleteMemberQuery>,
  _res: ApiResponseType<any>
): Promise<OrgDeleteMemberResponse> {
  const { orgId, tmbId } = req.query;
  if (!tmbId) {
    return Promise.reject(CommonErrEnum.missingParams);
  }

  const { teamId } = await authOrgMember({
    req,
    authToken: true,
    orgIds: orgId
  });

  const member = await MongoOrgMemberModel.findOne({ teamId, orgId, tmbId });
  if (!member) {
    return Promise.reject(TeamErrEnum.orgMemberNotExist);
  }

  await member.deleteOne();

  return {};
}

export default NextAPI(handler);
