import { NextAPI } from '@/service/middleware/entry';
import { DEFAULT_ORG_AVATAR } from '@fastgpt/global/common/system/constants';
import { TeamReadPermissionVal } from '@fastgpt/global/support/permission/user/constant';
import type { OrgListItemType } from '@fastgpt/global/support/user/team/org/type';
import { MongoOrgModel } from '@fastgpt/service/support/permission/org/orgSchema';
import { authUserPer } from '@fastgpt/service/support/permission/user/auth';
import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { PerResourceTypeEnum } from '@fastgpt/global/support/permission/constant';
import { MongoResourcePermission } from '@fastgpt/service/support/permission/schema';
import { TeamPermission } from '@fastgpt/global/support/permission/user/controller';
import { countOrgChildren, getRootOrg } from '@/service/support/user/team/org/utils';
import { getOrgChildrenPath } from '@fastgpt/global/support/user/team/org/constant';
import { replaceRegChars } from '@fastgpt/global/common/string/tools';

export type OrgListQuery = {};
export type OrgListBody = {
  orgId: string; // "" ==> root
  withPermission?: boolean;
  searchKey?: string;
};
export type OrgListResponse = OrgListItemType[];

async function handler(
  req: ApiRequestProps<OrgListBody, OrgListQuery>,
  res: ApiResponseType<any>
): Promise<OrgListResponse> {
  const { orgId, withPermission, searchKey } = req.body;
  const regex = searchKey ? new RegExp(replaceRegChars(searchKey), 'i') : undefined;

  const { teamId } = await authUserPer({
    req,
    per: TeamReadPermissionVal,
    authToken: true
  });

  const orgs = await (async () => {
    if (searchKey) {
      return await MongoOrgModel.find({ teamId, name: regex }).lean();
    }
    const org = await (async () => {
      if (orgId === '') {
        return getRootOrg({ teamId });
      }
      return MongoOrgModel.findById(orgId);
    })();
    if (!org) {
      return Promise.reject('Org not found');
    }
    return MongoOrgModel.find({ teamId, path: getOrgChildrenPath(org) }).lean();
  })();

  // get permissions
  const permissions = withPermission
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
