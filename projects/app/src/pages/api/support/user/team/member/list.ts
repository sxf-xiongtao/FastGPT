import { NextAPI } from '@/service/middleware/entry';
import {
  formatTeamMemberItemType,
  getMembersOrgs,
  getMembersPermission
} from '@/service/support/user/team/controller';
import { getRootOrg } from '@/service/support/user/team/org/utils';
import { replaceRegChars } from '@fastgpt/global/common/string/tools';
import { TeamMemberStatusEnum } from '@fastgpt/global/support/user/team/constant';
import type { TeamMemberItemType, TeamMemberSchema } from '@fastgpt/global/support/user/team/type';
import { parsePaginationRequest } from '@fastgpt/service/common/api/pagination';
import type { PipelineStage } from '@fastgpt/service/common/mongo';
import { Types } from '@fastgpt/service/common/mongo';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { MongoGroupMemberModel } from '@fastgpt/service/support/permission/memberGroup/groupMemberSchema';
import { MongoOrgMemberModel } from '@fastgpt/service/support/permission/org/orgMemberSchema';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import type { PaginationProps, PaginationResponse } from '@fastgpt/web/common/fetch/type';

export type MemberListQuery = {};
export type MemberListBody = PaginationProps<{
  withPermission?: boolean; // 是否获取权限信息
  withOrgs?: boolean; // 是否获取组织信息
  searchKey?: string; // 搜索关键词 支持搜索：用户名、联系方式、memberName
  groupId?: string; // 通过 GroupId 查询筛选
  orgId?: string; // 通过 OrgId 查询筛选
  status?: 'active' | 'inactive';
}>;

export type MemberListResponse = PaginationResponse<
  TeamMemberItemType<{
    withPermission: MemberListBody['withPermission'];
    withOrgs: MemberListBody['withOrgs'];
    withGroupRole: MemberListBody['groupId'] extends string ? true : false;
  }>
>;

async function handler(
  req: ApiRequestProps<MemberListBody, MemberListQuery>,
  _res: ApiResponseType<any>
): Promise<MemberListResponse> {
  const { teamId } = await authCert({ req, authToken: true });
  const { offset, pageSize } = parsePaginationRequest(req);
  const { status, withOrgs, withPermission, searchKey, groupId, orgId } = req.body;
  const regex = searchKey ? RegExp(replaceRegChars(searchKey), 'i') : undefined;

  const [filterTmbIds, _orgMembers, _groupMembers] = await (async () => {
    if (orgId !== undefined) {
      const _orgid = await (async () => {
        if (!orgId) return (await getRootOrg({ teamId }))._id;
        return orgId;
      })();
      const orgMembers = await MongoOrgMemberModel.find({ teamId, orgId: _orgid }).lean();
      return [orgMembers.map((m) => m.tmbId), orgMembers, undefined];
    }
    if (groupId !== undefined) {
      const groupMembers = await MongoGroupMemberModel.find({ groupId }).lean();
      return [groupMembers.map((m) => m.tmbId), undefined, groupMembers];
    }
    return [undefined, undefined, undefined];
  })();

  const usersFilterByUsernameAndContact = searchKey
    ? await MongoUser.find({
        $or: [{ username: regex }, { contact: regex }]
      }).lean()
    : null;

  const pipeline: PipelineStage[] = [
    {
      $match: {
        teamId: new Types.ObjectId(teamId),
        ...(filterTmbIds ? { _id: { $in: filterTmbIds } } : {}),
        ...(searchKey
          ? {
              $or: [
                ...(usersFilterByUsernameAndContact
                  ? [{ userId: { $in: usersFilterByUsernameAndContact.map((u) => u._id) } }]
                  : []),
                { name: regex }
              ]
            }
          : {}),
        ...(status
          ? status === 'active'
            ? { status: TeamMemberStatusEnum.active }
            : { status: { $ne: TeamMemberStatusEnum.active } }
          : {})
      }
    },
    {
      $addFields: {
        statusOrder: {
          $switch: {
            branches: [
              { case: { $eq: ['$status', 'active'] }, then: 1 },
              { case: { $eq: ['$status', 'leave'] }, then: 2 },
              { case: { $eq: ['$status', 'forbidden'] }, then: 3 }
            ],
            default: 4 // 如果有其他状态，可以给一个默认值
          }
        }
      }
    },
    {
      $sort: { statusOrder: 1, _id: 1 }
    }
  ];

  const [members, total] = await Promise.all([
    MongoTeamMember.aggregate<TeamMemberSchema>([
      ...pipeline,
      {
        $skip: offset
      },
      {
        $limit: pageSize
      }
    ]),
    MongoTeamMember.aggregate<{
      count?: number;
    }>([...pipeline]).count('count')
  ]);

  const users = await MongoUser.find({ _id: { $in: members.map((m) => m.userId) } }).lean();
  const memberWithContact = members.map((member) => ({
    ...member,
    user: {
      contact: users.find((u) => String(u._id) === String(member.userId))?.contact
    }
  }));

  const list = await (async () => {
    let list = memberWithContact;
    if (withPermission) {
      list = await getMembersPermission({
        members: list,
        teamId
      });
    }
    if (withOrgs) {
      list = await getMembersOrgs({
        members: list,
        teamId
      });
    }
    if (groupId) {
      list = list.map((item) => ({
        ...item,
        groupRole: _groupMembers?.find((m) => String(m.tmbId) === String(item._id))?.role
      }));
    }
    return list.map(formatTeamMemberItemType);
  })();

  return {
    total: total[0]?.count ?? 0,
    list
  };
}
export default NextAPI(handler);
