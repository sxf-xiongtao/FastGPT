import { NextAPI } from '@/service/middleware/entry';
import { DEFAULT_ORG_AVATAR } from '@fastgpt/global/common/system/constants';
import { TeamReadPermissionVal } from '@fastgpt/global/support/permission/user/constant';
import type { OrgListItemType } from '@fastgpt/global/support/user/team/org/type';
import {
  createRootOrg,
  getChildrenByOrg
} from '@fastgpt/service/support/permission/org/controllers';
import { MongoOrgModel } from '@fastgpt/service/support/permission/org/orgSchema';
import { authUserPer } from '@fastgpt/service/support/permission/user/auth';
import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { PerResourceTypeEnum } from '@fastgpt/global/support/permission/constant';
import { MongoResourcePermission } from '@fastgpt/service/support/permission/schema';
import { TeamPermission } from '@fastgpt/global/support/permission/user/controller';
import { countOrgChildren, getRootOrg } from '@/service/support/user/team/org/utils';
import { MongooseError } from '@fastgpt/service/common/mongo';
import { getOrgChildrenPath } from '@fastgpt/global/support/user/team/org/constant';

export type OrgListQuery = {
  orgPath?: string;
  getPermissions?: boolean;
};
export type OrgListBody = {};
export type OrgListResponse = OrgListItemType[];

async function handler(
  req: ApiRequestProps<OrgListBody, OrgListQuery>,
  res: ApiResponseType<any>
): Promise<OrgListResponse> {
  const { orgPath: path = '', getPermissions } = req.query;

  const { teamId } = await authUserPer({
    req,
    per: TeamReadPermissionVal,
    authToken: true
  });

  const orgs = await (async () => {
    if (path === '') {
      const rootOrg = await getRootOrg({ teamId });
      return await MongoOrgModel.find({ teamId, path: getOrgChildrenPath(rootOrg) }).lean();
    }
    return MongoOrgModel.find({ teamId, path }).lean();
  })();

  // get permissions
  const permissions = getPermissions
    ? await MongoResourcePermission.find({
        resourceType: PerResourceTypeEnum.team,
        teamId,
        resourceId: null, // for hitting the index
        orgId: { $in: orgs.map((org) => org._id) }
      }).lean()
    : undefined;

  return Promise.all(
    orgs.map(async (org) => {
      const per = permissions?.find(
        (permission) => String(permission.orgId) === String(org._id)
      )?.permission;

      return <OrgListItemType>{
        ...org,
        avatar: org.avatar || DEFAULT_ORG_AVATAR,
        permission: per ? new TeamPermission({ per }) : undefined,
        total: await countOrgChildren({ teamId, path: getOrgChildrenPath(org), orgId: org._id })
      };
    })
  );
}

export default NextAPI(handler);
