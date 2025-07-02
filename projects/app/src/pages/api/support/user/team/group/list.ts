import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { authUserPer } from '@fastgpt/service/support/permission/user/auth';
import { TeamReadPermissionVal } from '@fastgpt/global/support/permission/user/constant';
import { MongoMemberGroupModel } from '@fastgpt/service/support/permission/memberGroup/memberGroupSchema';
import type {
  GroupMemberSchemaType,
  MemberGroupListItemType
} from '@fastgpt/global/support/permission/memberGroup/type';
import { MongoGroupMemberModel } from '@fastgpt/service/support/permission/memberGroup/groupMemberSchema';
import { DefaultGroupName } from '@fastgpt/global/support/user/team/group/constant';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { replaceRegChars } from '@fastgpt/global/common/string/tools';
import type { TeamMemberSchema } from '@fastgpt/global/support/user/team/type';
import type { GetGroupListBody } from '@fastgpt/global/support/permission/memberGroup/api';
import { getTeamOwner } from '@fastgpt/service/support/user/team/controller';
import { Permission } from '@fastgpt/global/support/permission/controller';
import { ManagePermissionVal, NullPermission } from '@fastgpt/global/support/permission/constant';

export type GroupListQuery = {};
export type GroupListBody = GetGroupListBody;
export type GroupListResponse<WithMembers extends boolean | undefined> =
  MemberGroupListItemType<WithMembers>[];

async function handler(
  req: ApiRequestProps<GroupListBody, GroupListQuery>,
  _res: ApiResponseType<any>
): Promise<GroupListResponse<typeof req.body.withMembers>> {
  const { searchKey, withMembers } = req.body;

  const { teamId, tmbId, permission } = await authUserPer({
    req,
    per: TeamReadPermissionVal,
    authToken: true
  });

  const allGroups = await MongoMemberGroupModel.find(
    {
      teamId,
      ...(searchKey
        ? {
            name: new RegExp(replaceRegChars(searchKey), 'i')
          }
        : {})
    },
    undefined,
    {
      limit: searchKey ? 30 : undefined
    }
  )
    .sort({ updateTime: -1 })
    .lean();

  // 默认组排前面
  allGroups.sort((a, b) => {
    if (a.name === DefaultGroupName) return -1;
    if (b.name === DefaultGroupName) return 1;
    return 0;
  });

  const groupIds = allGroups.map((group) => group._id);

  // Get group members data
  const { groupMemberDataMap, teamOwner, ownerGroupMembers, totalTeamMembers } =
    await (async () => {
      if (!withMembers) return {};

      // Get group members
      const groupMembers = await MongoGroupMemberModel.find(
        { groupId: { $in: groupIds } },
        'tmbId groupId role'
      ).lean();
      // owner 排前面
      groupMembers.sort((a, b) => {
        if (a.role === 'owner') return -1;
        if (b.role === 'owner') return 1;
        return 0;
      });

      // 分 group 存储 members
      const groupMembersMap = new Map<string, GroupMemberSchemaType[]>();
      groupMembers.forEach((item) => {
        const groupId = String(item.groupId);
        if (!groupMembersMap.has(groupId)) {
          groupMembersMap.set(groupId, []);
        }
        groupMembersMap.get(groupId)!.push(item);
      });

      // 获取 group 前 3 个 member 的 Id （肯定包含owner）
      const selectedTmbIds = new Set<string>();
      groupMembersMap.forEach((members, groupId) => {
        members.slice(0, 3).forEach((item) => {
          selectedTmbIds.add(String(item.tmbId));
        });
      });

      // 批量获取 members 数据
      const tmbs = await MongoTeamMember.find({
        teamId,
        _id: { $in: Array.from(selectedTmbIds) }
      }).lean();
      const membersMap = new Map<string, TeamMemberSchema>();
      tmbs.forEach((item) => {
        membersMap.set(String(item._id), item);
      });

      // 分 group 进行 preview 成员和 owner 获取
      const groupMemberDataMap = new Map<
        string,
        {
          members: TeamMemberSchema[];
          totalMembers: number;
          owner?: TeamMemberSchema;
          permission: Permission;
        }
      >();
      groupMembersMap.forEach((members, groupId) => {
        const ownerMember = members.find((item) => item.role === 'owner');

        groupMemberDataMap.set(groupId, {
          owner: ownerMember ? membersMap.get(String(ownerMember.tmbId)) : undefined,
          members: members.map((item) => membersMap.get(String(item.tmbId))!).filter(Boolean),
          totalMembers: members.length,
          permission: new Permission({
            per: members.some((item) => String(item.tmbId) === tmbId && item.role === 'admin')
              ? ManagePermissionVal
              : NullPermission,
            isOwner:
              permission.hasManagePer ||
              members.some((item) => String(item.tmbId) === tmbId && item.role === 'owner')
          })
        });
      });

      // 获取 owner group 数据
      const [teamOwner, ownerGroupMembers, totalTeamMembers] = await Promise.all([
        getTeamOwner(teamId),
        MongoTeamMember.find({ teamId }).limit(3).lean(),
        MongoTeamMember.countDocuments({ teamId })
      ]);

      return {
        groupMemberDataMap,
        teamOwner,
        ownerGroupMembers,
        totalTeamMembers
      };
    })();

  return allGroups.map((group) => {
    if (group.name === DefaultGroupName) {
      return {
        ...group,
        count: totalTeamMembers,
        members:
          ownerGroupMembers?.map((item) => ({
            tmbId: item._id,
            name: item.name,
            avatar: item.avatar
          })) || [],
        owner: teamOwner
          ? {
              tmbId: teamOwner._id,
              name: teamOwner.name,
              avatar: teamOwner.avatar
            }
          : undefined,
        permission: new Permission({
          per: NullPermission,
          isOwner: false
        })
      };
    }

    const groupMemberData = groupMemberDataMap?.get(String(group._id));

    return {
      ...group,
      count: groupMemberData?.totalMembers,
      members:
        groupMemberData?.members?.map((item) => ({
          tmbId: item._id,
          name: item.name,
          avatar: item.avatar
        })) || [],
      owner: groupMemberData?.owner
        ? {
            tmbId: groupMemberData.owner._id,
            name: groupMemberData.owner.name,
            avatar: groupMemberData.owner.avatar
          }
        : undefined,
      permission: groupMemberData?.permission
    };
  });
}

export default NextAPI(handler);
