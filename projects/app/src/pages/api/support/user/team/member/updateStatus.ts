import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { authUserPer } from '@fastgpt/service/support/permission/user/auth';
import { TeamManagePermissionVal } from '@fastgpt/global/support/permission/user/constant';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { UpdateStatusProps } from '@fastgpt/global/support/user/team/controller';
import {
  getResourcePermission,
  parseHeaderCert
} from '@fastgpt/service/support/permission/controller';
import { Permission } from '@fastgpt/global/support/permission/controller';
import { OwnerPermissionVal } from '@fastgpt/global/support/permission/constant';

export type MemberUpdateStatusQuery = {};
export type MemberUpdateStatusBody = UpdateStatusProps;
export type MemberUpdateStatusResponse = {};

async function handler(
  req: ApiRequestProps<MemberUpdateStatusBody, MemberUpdateStatusQuery>,
  _res: ApiResponseType<any>
): Promise<MemberUpdateStatusResponse> {
  const { tmbId, status } = req.body;
  const { teamId } = await parseHeaderCert({ req, authToken: true });

  const tmbPer = await getResourcePermission({
    tmbId,
    resourceType: 'team',
    teamId
  });

  if (
    new Permission({
      per: tmbPer
    }).hasManagePer
  ) {
    await authUserPer({ req, authToken: true, per: OwnerPermissionVal });
  } else {
    await authUserPer({ req, authToken: true, per: TeamManagePermissionVal });
  }

  await MongoTeamMember.findOneAndUpdate(
    {
      _id: tmbId
    },
    {
      status,
      updateTime: new Date()
    }
  );

  return {};
}
export default NextAPI(handler);
