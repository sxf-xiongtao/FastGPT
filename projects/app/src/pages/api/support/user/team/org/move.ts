import { NextAPI } from '@/service/middleware/entry';
import { CommonErrEnum } from '@fastgpt/global/common/error/code/common';
import team, { TeamErrEnum } from '@fastgpt/global/common/error/code/team';
import type { putMoveOrgType } from '@fastgpt/global/support/user/team/org/api';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import { authOrgMember } from '@fastgpt/service/support/permission/auth/org';
import { MongoOrgModel } from '@fastgpt/service/support/permission/org/orgSchema';
import { getChildrenByOrg } from '@fastgpt/service/support/permission/org/controllers';
import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { getOrgChildrenPath } from '@fastgpt/global/support/user/team/org/constant';
import { getRootOrg } from '@/service/support/user/team/org/utils';

export type OrgMoveBody = putMoveOrgType;
export type OrgMoveQuery = {};
export type OrgMoveResponse = undefined;

async function handler(
  req: ApiRequestProps<OrgMoveBody, OrgMoveQuery>,
  _res: ApiResponseType<any>
): Promise<OrgMoveResponse> {
  const { orgId, targetOrgId } = req.body;
  if (!orgId) {
    return Promise.reject(CommonErrEnum.missingParams);
  }
  if (orgId === targetOrgId) {
    return Promise.reject(TeamErrEnum.cannotMoveToSubPath);
  }

  const { teamId } = await authOrgMember({
    req,
    authToken: true
  });

  const org = await MongoOrgModel.findOne({ _id: orgId, teamId }).lean();
  if (!org) {
    return Promise.reject(TeamErrEnum.orgNotExist);
  }

  const parent = await (async () => {
    if (!targetOrgId) return await getRootOrg({ teamId });
    return await MongoOrgModel.findOne({ _id: targetOrgId, teamId }).lean();
  })();
  if (!parent) {
    return Promise.reject(TeamErrEnum.orgParentNotExist);
  }

  // forbid moving to children
  if (parent.path.includes(org.pathId)) {
    return Promise.reject(TeamErrEnum.cannotMoveToSubPath);
  }
  // omit moving to same parent
  if (org.path === getOrgChildrenPath(parent)) {
    return;
  }

  await mongoSessionRun(async (session) => {
    // update children's path
    const children = await getChildrenByOrg({ org, teamId, session });
    const updateOps = children.map((child) => ({
      updateOne: {
        filter: { _id: child._id },
        update: { path: child.path.replace(org.path, getOrgChildrenPath(parent)) }
      }
    }));
    await MongoOrgModel.bulkWrite(updateOps, { session });

    // update org's path
    await MongoOrgModel.updateOne(
      { _id: orgId },
      {
        path: getOrgChildrenPath(parent)
      },
      { session }
    );
  });
}

export default NextAPI(handler);
