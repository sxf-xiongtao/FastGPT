import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { authUserPer } from '@fastgpt/service/support/permission/user/auth';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { MongoOrgModel } from '@fastgpt/service/support/permission/org/orgSchema';
import type { UserModelSchema } from '@fastgpt/global/support/user/type';
import type { OrgMemberSchemaType } from '@fastgpt/global/support/user/team/org/type';
import { generateCsv } from '@fastgpt/service/common/file/csv';
import format from 'date-fns/format';
import { useIPFrequencyLimit } from '@fastgpt/service/common/middle/reqFrequencyLimit';
import { OwnerPermissionVal } from '@fastgpt/global/support/permission/constant';

export type TeamMemberExportQuery = {};
export type TeamMemberExportBody = {};
export type TeamMemberExportResponse = {};

const statusMap = {
  active: '正常',
  leave: '已离职',
  forbidden: '已停用'
};

async function handler(
  req: ApiRequestProps<TeamMemberExportBody, TeamMemberExportQuery>,
  res: ApiResponseType<any>
): Promise<TeamMemberExportResponse> {
  const { teamId } = await authUserPer({ req, authToken: true, per: OwnerPermissionVal });
  // 1. get members
  const members = await MongoTeamMember.find({ teamId })
    .populate<{
      user: UserModelSchema;
    }>('user')
    .lean();
  const orgs = await MongoOrgModel.find({ teamId })
    .populate<{
      members: OrgMemberSchemaType[];
    }>('members')
    .lean();
  // 2. prepare data
  const headers = ['账号', '用户名', '联系方式', '部门', '加入时间', '更新时间', '状态'];
  const data = members.map((member) => {
    const memberOrgs = orgs.filter((org) =>
      org.members?.find((m) => String(m.tmbId) === String(member._id))
    );
    return [
      member.user.username,
      member.name,
      member.user.contact || '-',
      memberOrgs.map((org) => org.name).join(', ') || '-',
      format(member.createTime, 'yyyy-MM-dd HH:mm:ss'),
      member.updateTime ? format(member.updateTime, 'yyyy-MM-dd HH:mm:ss') : '-',
      statusMap[member.status]
    ];
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=teamMember.csv');
  res.write(generateCsv(headers, data));
  res.end();
  return {};
}

export default NextAPI(
  useIPFrequencyLimit({
    id: 'export-members',
    seconds: 60,
    limit: 1
  }),
  handler
);
