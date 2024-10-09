import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { PermissionValueType } from '@fastgpt/global/support/permission/type';
import { authUserPer } from '@fastgpt/service/support/permission/user/auth';
import { PerResourceTypeEnum } from '@fastgpt/global/support/permission/constant';
import { TeamManagePermissionVal } from '@fastgpt/global/support/permission/user/constant';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import { MongoResourcePermission } from '@fastgpt/service/support/permission/schema';
import { RequireAtLeastOne } from '@fastgpt/global/common/type/utils';
export type PermissionUpdateQuery = {};

export type PermissionUpdateBody = RequireAtLeastOne<
  {
    members: string[];
    groups: string[];
    permission: PermissionValueType;
  },
  'members' | 'groups'
>;

export type PermissionUpdateResponse = {};
async function handler(
  req: ApiRequestProps<PermissionUpdateBody, PermissionUpdateQuery>,
  _res: ApiResponseType<any>
): Promise<PermissionUpdateResponse> {
  const { teamId } = await authUserPer({
    req,
    per: TeamManagePermissionVal,
    authToken: true
  });

  const { members, groups, permission } = req.body;

  await mongoSessionRun(async (session) => {
    if (members) {
      for await (const tmbId of members) {
        await MongoResourcePermission.findOneAndUpdate(
          {
            tmbId,
            resourceType: PerResourceTypeEnum.team,
            teamId
          },
          {
            permission
          },
          {
            session,
            upsert: true
          }
        );
      }
    }
    if (groups) {
      console.log('groups', groups);
      for await (const groupId of groups) {
        await MongoResourcePermission.findOneAndUpdate(
          {
            groupId,
            resourceType: PerResourceTypeEnum.team,
            teamId
          },
          {
            permission
          },
          {
            session,
            upsert: true
          }
        );
      }
    }
  });

  return {};
}
export default NextAPI(handler);
