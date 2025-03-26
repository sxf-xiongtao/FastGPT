import { NextAPI } from '@/service/middleware/entry';
import { getRootOrg } from '@/service/support/user/team/org/utils';
import { CommonErrEnum } from '@fastgpt/global/common/error/code/common';
import { TeamErrEnum } from '@fastgpt/global/common/error/code/team';
import type { postCreateOrgData } from '@fastgpt/global/support/user/team/org/api';
import { getOrgChildrenPath } from '@fastgpt/global/support/user/team/org/constant';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import { authOrgMember } from '@fastgpt/service/support/permission/auth/org';
import { MongoOrgModel } from '@fastgpt/service/support/permission/org/orgSchema';
import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';

export type OrgCreateQuery = {};
export type OrgCreateBody = postCreateOrgData;
export type OrgCreateResponse = undefined;

async function handler(
  req: ApiRequestProps<OrgCreateBody, OrgCreateQuery>,
  _res: ApiResponseType<any>
): Promise<OrgCreateResponse> {
  const { name, avatar, orgId, description } = req.body;

  if (!name || name.length === 0) {
    return Promise.reject(CommonErrEnum.missingParams);
  }

  const { teamId } = await authOrgMember({
    req,
    authToken: true
  });

  await mongoSessionRun(async (session) => {
    // Find the parent org
    const parent = await (async () => {
      if (orgId === '') {
        return await getRootOrg({ teamId });
      }
      return await MongoOrgModel.findOne({ _id: orgId, teamId }, undefined, {
        session
      }).lean();
    })();

    if (!parent) {
      return Promise.reject(TeamErrEnum.orgParentNotExist);
    }
    await MongoOrgModel.create(
      [
        {
          teamId,
          name,
          avatar,
          description,
          path: getOrgChildrenPath(parent)
        }
      ],
      { session, ordered: true }
    );
  });
}

export default NextAPI(handler);
