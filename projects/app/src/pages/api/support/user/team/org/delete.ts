import { NextAPI } from '@/service/middleware/entry';
import { CommonErrEnum } from '@fastgpt/global/common/error/code/common';
import { TeamErrEnum } from '@fastgpt/global/common/error/code/team';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import { authOrgMember } from '@fastgpt/service/support/permission/auth/org';
import { getChildrenByOrg } from '@fastgpt/service/support/permission/org/controllers';
import { MongoOrgMemberModel } from '@fastgpt/service/support/permission/org/orgMemberSchema';
import { MongoOrgModel } from '@fastgpt/service/support/permission/org/orgSchema';
import { MongoResourcePermission } from '@fastgpt/service/support/permission/schema';
import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { addAuditLog } from '@fastgpt/service/support/user/audit/util';
import { AuditEventEnum } from '@fastgpt/global/support/user/audit/constants';

export type OrgDeleteQuery = {
  orgId: string;
};
export type OrgDeleteBody = {};
export type OrgDeleteResponse = undefined;

async function handler(
  req: ApiRequestProps<OrgDeleteBody, OrgDeleteQuery>,
  _res: ApiResponseType<any>
): Promise<OrgDeleteResponse> {
  const { orgId } = req.query;
  if (!orgId) {
    return Promise.reject(CommonErrEnum.missingParams);
  }
  const { teamId, tmbId } = await authOrgMember({
    req,
    authToken: true,
    orgIds: orgId
  });

  const orgName = await MongoOrgModel.findOne({ _id: orgId }, 'name').then((org) => org?.name);

  if (!orgName) {
    return Promise.reject(CommonErrEnum.fileNotFound);
  }

  await mongoSessionRun(async (session) => {
    const org = await MongoOrgModel.findOne({ _id: orgId, teamId }, undefined, { session });
    if (!org) {
      return Promise.reject(TeamErrEnum.orgNotExist);
    }
    if (org.path === '') {
      return Promise.reject(TeamErrEnum.cannotModifyRootOrg);
    }

    const children = await getChildrenByOrg({ org, teamId, session });
    if (children.length > 0) {
      return Promise.reject(TeamErrEnum.cannotDeleteNonEmptyOrg);
    }

    await org.deleteOne({ session });
    await MongoOrgMemberModel.deleteMany(
      {
        teamId,
        orgId
      },
      {
        session
      }
    );
    await MongoResourcePermission.deleteMany(
      {
        teamId,
        orgId
      },
      {
        session
      }
    );
  });

  addAuditLog({
    tmbId,
    teamId,
    event: AuditEventEnum.DELETE_DEPARTMENT,
    params: {
      departmentName: orgName
    }
  });
}

export default NextAPI(handler);
