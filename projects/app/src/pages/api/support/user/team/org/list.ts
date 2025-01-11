import { NextAPI } from '@/service/middleware/entry';
import { DEFAULT_ORG_AVATAR } from '@fastgpt/global/common/system/constants';
import { TeamReadPermissionVal } from '@fastgpt/global/support/permission/user/constant';
import type { OrgMemberSchemaType, OrgType } from '@fastgpt/global/support/user/team/org/type';
import { createRootOrg } from '@fastgpt/service/support/permission/org/controllers';
import { MongoOrgModel } from '@fastgpt/service/support/permission/org/orgSchema';
import { authUserPer } from '@fastgpt/service/support/permission/user/auth';
import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { PerResourceTypeEnum } from '@fastgpt/global/support/permission/constant';
import { MongoResourcePermission } from '@fastgpt/service/support/permission/schema';
import { TeamPermission } from '@fastgpt/global/support/permission/user/controller';

export type OrgListQuery = {};
export type OrgListBody = {};
export type OrgListResponse = OrgType[];

async function handler(
  req: ApiRequestProps<OrgListBody, OrgListQuery>,
  res: ApiResponseType<any>
): Promise<OrgListResponse> {
  const { teamId, tmb } = await authUserPer({
    req,
    per: TeamReadPermissionVal,
    authToken: true
  });

  const allOrgs = await MongoOrgModel.find({ teamId })
    .populate<{ members: OrgMemberSchemaType[] }>('members')
    .sort({
      _id: 1
    })
    .lean();

  if (allOrgs.length === 0) {
    createRootOrg({ teamId });
    return handler(req, res);
  }

  const allPermissions = await MongoResourcePermission.find({
    orgId: { $in: allOrgs.map((org) => org._id) },
    resourceType: PerResourceTypeEnum.team
  }).lean();

  return allOrgs.map((org) => {
    const per = allPermissions.find(
      (permission) => String(permission.orgId) === String(org._id)
    )?.permission;

    if (org.path === '') {
      return {
        ...org,
        avatar: tmb.teamAvatar || DEFAULT_ORG_AVATAR,
        name: tmb.teamName,
        permission: new TeamPermission({ per })
      };
    }

    return {
      ...org,
      avatar: org.avatar || DEFAULT_ORG_AVATAR,
      permission: new TeamPermission({ per })
    };
  });
}

export default NextAPI(handler);
