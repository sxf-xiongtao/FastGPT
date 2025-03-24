import { NextAPI } from '@/service/middleware/entry';
import { DEFAULT_ORG_AVATAR } from '@fastgpt/global/common/system/constants';
import {
  TeamDefaultPermissionVal,
  TeamReadPermissionVal
} from '@fastgpt/global/support/permission/user/constant';
import type { OrgMemberSchemaType, OrgType } from '@fastgpt/global/support/user/team/org/type';
import { createRootOrg } from '@fastgpt/service/support/permission/org/controllers';
import { MongoOrgModel } from '@fastgpt/service/support/permission/org/orgSchema';
import { authUserPer } from '@fastgpt/service/support/permission/user/auth';
import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { PerResourceTypeEnum } from '@fastgpt/global/support/permission/constant';
import { MongoResourcePermission } from '@fastgpt/service/support/permission/schema';
import { TeamPermission } from '@fastgpt/global/support/permission/user/controller';
import { addSourceMember } from '@fastgpt/service/support/user/utils';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { notLeaveStatus } from '@fastgpt/global/support/user/team/constant';

export type OrgListQuery = {
  orgPath?: string;
};
export type OrgListBody = {};
export type OrgListResponse = OrgType[];

async function handler(
  req: ApiRequestProps<OrgListBody, OrgListQuery>,
  res: ApiResponseType<any>
): Promise<OrgListResponse> {
  const { orgPath: path = '' } = req.query;
  const { teamId, tmb } = await authUserPer({
    req,
    per: TeamReadPermissionVal,
    authToken: true
  });

  const orgs = await (async () => {
    if (path === '') {
      // get root org and its children
      const rootOrg = await (async () => {
        const rootOrg = await MongoOrgModel.findOne({ teamId, path })
          .populate<{
            members: OrgMemberSchemaType[];
          }>('members')
          .lean();
        if (!rootOrg) {
          const [org] = await createRootOrg({ teamId });
          return {
            ...org,
            members: []
          };
        }
        return rootOrg;
      })();
      const orgs = await MongoOrgModel.find({ teamId, path: '/' + rootOrg.pathId })
        .populate<{
          members: OrgMemberSchemaType[];
        }>('members')
        .lean();
      return [rootOrg, ...orgs];
    } else {
      const orgs = await MongoOrgModel.find({ teamId, path })
        .populate<{
          members: OrgMemberSchemaType[];
        }>('members')
        .lean();
      return orgs;
    }
  })();

  // if (path === '' && orgs.length === 0) {
  //   // get root org and create if not exists
  //   return [
  //     // {
  //     //   ...org,
  //     //   avatar: tmb.teamAvatar || DEFAULT_ORG_AVATAR,
  //     //   name: tmb.teamName,
  //     //   permission: TeamDefaultPermissionVal,
  //     //   total: 0
  //     // }
  //   ];
  // }

  const permissions = await MongoResourcePermission.find({
    resourceType: PerResourceTypeEnum.team,
    teamId,
    resourceId: null, // for hitting the index
    orgId: { $in: orgs.map((org) => org._id) }
  }).lean();

  const orgChildrenCount = new Map<string, number>();
  for await (const org of orgs) {
    const count = await MongoOrgModel.countDocuments({
      path: org.path + '/' + org.pathId,
      teamId
    });
    orgChildrenCount.set(String(org._id), count);
  }

  return orgs.map((org) => {
    const per = permissions.find(
      (permission) => String(permission.orgId) === String(org._id)
    )?.permission;
    return <OrgType>{
      ...org,
      avatar: org.avatar || DEFAULT_ORG_AVATAR,
      permission: new TeamPermission({ per }),
      total: org.members.length + (orgChildrenCount.get(String(org._id)) || 0)
    };
  });
}

export default NextAPI(handler);
