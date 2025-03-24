import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { authUserPer } from '@fastgpt/service/support/permission/user/auth';
import { TeamReadPermissionVal } from '@fastgpt/global/support/permission/user/constant';
import { MongoMemberGroupModel } from '@fastgpt/service/support/permission/memberGroup/memberGroupSchema';
import { MemberGroupListType } from '@fastgpt/global/support/permission/memberGroup/type';
import { MongoGroupMemberModel } from '@fastgpt/service/support/permission/memberGroup/groupMemberSchema';
import { DefaultGroupName } from '@fastgpt/global/support/user/team/group/constant';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';

export type GroupListQuery = {};
export type GroupListBody = {};
export type GroupListResponse = MemberGroupListType;

async function handler(
  req: ApiRequestProps<GroupListBody, GroupListQuery>,
  _res: ApiResponseType<any>
): Promise<GroupListResponse> {
  const { teamId, tmbId } = await authUserPer({
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

  const groupMembers = await MongoGroupMemberModel.find(
    { groupId: { $in: groupIds } },
    'tmbId groupId role'
  ).lean();

  const selectedGroupMembers = groupIds
    .flatMap((groupId) =>
      groupMembers.filter((member) => String(member.groupId) === String(groupId)).slice(0, 3)
    )
    .concat(groupMembers.filter((gm) => gm.role === 'owner'));

  const tmbs = await MongoTeamMember.find({
    teamId,
    _id: { $in: selectedGroupMembers.map((member) => member.tmbId) }
  }).lean();

  return allGroups.map((group) => {
    if (group.name === DefaultGroupName) {
      return {
        ...group,
        members: [],
        count: 0,
        owner: {} as any,
        canEdit: false
      };
    }
    const myGroupMembers = groupMembers.filter(
      (member) => String(member.groupId) === String(group._id)
    );
    const myTmbIds = myGroupMembers.map((member) => String(member.tmbId));
    const myTmbs = tmbs.filter((tmb) => myTmbIds.includes(String(tmb._id)));
    const owner = myTmbs.find(
      (tmb) =>
        String(tmb._id) === String(myGroupMembers.find((member) => member.role === 'owner')?.tmbId)
    )!;
    const myAdminIds = myGroupMembers
      .filter((member) => member.role === 'admin')
      .map((member) => member.tmbId);

    return {
      ...group,
      members: myTmbs.map((tmb) => ({
        name: tmb.name,
        avatar: tmb.avatar,
        tmbId: tmb._id
      })),
      count: myGroupMembers.length,
      owner: {
        name: owner.name,
        avatar: owner.avatar,
        tmbId: String(owner._id)
      },
      canEdit: myAdminIds.includes(String(tmbId)) || tmbId === String(owner?._id)
    };
  });
}

export default NextAPI(handler);
