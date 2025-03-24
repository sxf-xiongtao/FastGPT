import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { MongoGroupMemberModel } from '@fastgpt/service/support/permission/memberGroup/groupMemberSchema';
import { GroupMemberRole } from '@fastgpt/global/support/permission/memberGroup/constant';
import { TeamMemberCollectionName } from '@fastgpt/global/support/user/team/constant';
import { TeamMemberSchema } from '@fastgpt/global/support/user/team/type';

export type GetGroupMembersQuery = {
  groupId: string;
};
export type GetGroupMembersBody = {};
export type GetGroupMembersResponse = {
  name: string;
  tmbId: string;
  avatar: string;
  role: `${GroupMemberRole}`;
}[];

async function handler(
  req: ApiRequestProps<GetGroupMembersBody, GetGroupMembersQuery>,
  res: ApiResponseType<any>
): Promise<GetGroupMembersResponse> {
  const { groupId } = req.query;

  const groupMembers = await MongoGroupMemberModel.find({
    groupId
  }).populate<{
    tmbId: TeamMemberSchema;
  }>({
    path: 'tmbId',
    localField: 'tmbId',
    foreignField: '_id',
    model: TeamMemberCollectionName
  });

  return groupMembers.map((m) => ({
    tmbId: String(m.tmbId._id),
    name: m.tmbId.name,
    avatar: m.tmbId.avatar,
    role: m.role
  }));
}
export default NextAPI(handler);
