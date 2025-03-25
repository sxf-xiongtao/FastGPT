import { NextAPI } from '@/service/middleware/entry';
import { DEFAULT_ORG_AVATAR } from '@fastgpt/global/common/system/constants';
import { TeamReadPermissionVal } from '@fastgpt/global/support/permission/user/constant';
import type { OrgListItemType } from '@fastgpt/global/support/user/team/org/type';
import { createRootOrg } from '@fastgpt/service/support/permission/org/controllers';
import { MongoOrgModel } from '@fastgpt/service/support/permission/org/orgSchema';
import { authUserPer } from '@fastgpt/service/support/permission/user/auth';
import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { PerResourceTypeEnum } from '@fastgpt/global/support/permission/constant';
import { MongoResourcePermission } from '@fastgpt/service/support/permission/schema';
import { TeamPermission } from '@fastgpt/global/support/permission/user/controller';
import { countOrgChildren } from '@/service/support/user/team/org/utils';
import { ParentIdType } from '@fastgpt/global/common/parentFolder/type';
import { getOrgChildrenPath } from '@fastgpt/global/support/user/team/org/constant';

export type OrgListQuery = {
  parentId: ParentIdType;
};
export type OrgListBody = {};
export type OrgListResponse = OrgListItemType[];

async function handler(
  req: ApiRequestProps<OrgListBody, OrgListQuery>,
  res: ApiResponseType<any>
): Promise<OrgListResponse> {
  const { parentId } = req.query;

  const { teamId } = await authUserPer({
    req,
    per: TeamReadPermissionVal,
    authToken: true
  });

  const orgs = await (async () => {
    if (parentId) {
      const org = await MongoOrgModel.findOne({ teamId, _id: parentId }).lean();
      if (!org) {
        return [];
      }
      return MongoOrgModel.find({ teamId, path: getOrgChildrenPath(org) }).lean();
    } else {
      // get root org and its children
      const rootOrg = await (async () => {
        const rootOrg = await MongoOrgModel.findOne({ teamId, path: '' }, 'pathId').lean();

        return rootOrg ?? (await createRootOrg({ teamId }))[0];
      })();

      return MongoOrgModel.find({ teamId, path: getOrgChildrenPath(rootOrg) }).lean();
    }
  })();

  // get permissions
  const permissions = await MongoResourcePermission.find({
    resourceType: PerResourceTypeEnum.team,
    teamId,
    resourceId: null, // for hitting the index
    orgId: { $in: orgs.map((org) => org._id) }
  }).lean();

  return Promise.all(
    orgs.map(async (org) => {
      const per = permissions.find(
        (permission) => String(permission.orgId) === String(org._id)
      )?.permission;

      return <OrgListItemType>{
        ...org,
        members: [],
        avatar: org.avatar || DEFAULT_ORG_AVATAR,
        permission: new TeamPermission({ per }),
        total: await countOrgChildren({ teamId, path: org.path, orgId: org._id })
      };
    })
  );
}

export default NextAPI(handler);
