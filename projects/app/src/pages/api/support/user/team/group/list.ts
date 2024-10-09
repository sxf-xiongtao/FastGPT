import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { authUserPer } from '@fastgpt/service/support/permission/user/auth';
import { PerResourceTypeEnum } from '@fastgpt/global/support/permission/constant';
import { TeamReadPermissionVal } from '@fastgpt/global/support/permission/user/constant';
import { MongoMemberGroupModel } from '@fastgpt/service/support/permission/memberGroup/memberGroupSchema';
import { MemberGroupListType } from '@fastgpt/global/support/permission/memberGroup/type';
import { MongoGroupMemberModel } from '@fastgpt/service/support/permission/memberGroup/groupMemberSchema';
import { MongoResourcePermission } from '@fastgpt/service/support/permission/schema';
import { TeamPermission } from '@fastgpt/global/support/permission/user/controller';
import { DefaultGroupName } from '@fastgpt/global/support/user/team/group/constant';

export type GroupListQuery = {};
export type GroupListBody = {};
export type GroupListResponse = MemberGroupListType;

async function handler(
  req: ApiRequestProps<GroupListBody, GroupListQuery>,
  _res: ApiResponseType<any>
): Promise<GroupListResponse> {
  const { teamId } = await authUserPer({
    req,
    per: TeamReadPermissionVal,
    authToken: true
  });

  const allGroups = await MongoMemberGroupModel.find({ teamId }).sort({ updateTime: -1 }).lean();
  const defaultGroup = allGroups.find((group) => group.name === DefaultGroupName);
  if (defaultGroup) {
    allGroups.splice(allGroups.indexOf(defaultGroup), 1);
    allGroups.unshift(defaultGroup);
  }
  const groupIds = allGroups.map((group) => group._id);

  const allMembers = await MongoGroupMemberModel.find(
    { groupId: { $in: groupIds } },
    'tmbId groupId role'
  ).lean();

  const allPermissions = await MongoResourcePermission.find(
    { groupId: { $in: groupIds }, resourceType: PerResourceTypeEnum.team },
    'permission groupId'
  ).lean();

  return allGroups.map((group) => {
    const members = allMembers
      .filter((member) => String(member.groupId) === String(group._id))
      .map((member) => ({
        role: member.role,
        tmbId: member.tmbId
      }));
    const per = allPermissions.find(
      (permission) => String(permission.groupId) === String(group._id)
    )?.permission;

    return {
      ...group,
      members: members,
      permission: new TeamPermission({ per })
    };
  });
}

export default NextAPI(handler);
