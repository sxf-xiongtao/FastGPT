import { NextAPI } from '@/service/middleware/entry';
import { CommonErrEnum } from '@fastgpt/global/common/error/code/common';
import type { putUpdateOrgData } from '@fastgpt/global/support/user/team/org/api';
import { MongoOrgModel } from '@fastgpt/service/support/permission/org/orgSchema';
import { authOrgMember } from '@fastgpt/service/support/permission/auth/org';
import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import { refreshSourceAvatar } from '@fastgpt/service/common/file/image/controller';
import { addAuditLog } from '@fastgpt/service/support/user/audit/util';
import { AuditEventEnum } from '@fastgpt/global/support/user/audit/constants';

export type OrgUpdateQuery = {};
export type OrgUpdateBody = putUpdateOrgData;
export type OrgUpdateResponse = undefined;

async function handler(
  req: ApiRequestProps<OrgUpdateBody, OrgUpdateQuery>,
  _res: ApiResponseType<any>
): Promise<OrgUpdateResponse> {
  const { orgId, name, avatar, description } = req.body;
  if (!orgId || !name) {
    return Promise.reject(CommonErrEnum.missingParams);
  }

  const orgIds = [orgId];

  const { teamId, tmbId } = await authOrgMember({
    req,
    authToken: true,
    orgIds
  });

  await mongoSessionRun(async (session) => {
    const org = await MongoOrgModel.findOneAndUpdate(
      { _id: orgId, teamId, path: { $ne: '' } },
      {
        ...(name && { name }),
        ...(avatar && { avatar }),
        description
      },
      { session }
    );

    await refreshSourceAvatar(avatar, org?.avatar, session);
  });

  addAuditLog({
    tmbId,
    teamId,
    event: AuditEventEnum.CHANGE_DEPARTMENT,
    params: {
      departmentName: name
    }
  });
}

export default NextAPI(handler);
