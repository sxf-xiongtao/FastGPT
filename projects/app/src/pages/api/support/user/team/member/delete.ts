import type { NextApiRequest, NextApiResponse } from 'next';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { getTeamMember } from '@/service/support/user/team/controller';
import { DelMemberProps } from '@fastgpt/global/support/user/team/controller';
import { authMemberPermission } from '@/service/support/permission/team/auth';
import { OwnerPermissionVal } from '@fastgpt/global/support/permission/constant';
import { NextAPI } from '@/service/middleware/entry';
import { removeUserFromTeam } from '@/service/support/user/controller';
import { TeamManagePermissionVal } from '@fastgpt/global/support/permission/user/constant';
import { addOperationLog } from '@fastgpt/service/support/operationLog/addOperationLog';
import { OperationLogEventEnum } from '@fastgpt/global/support/operationLog/constants';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';

export type MemberDeleteQuery = DelMemberProps;
export type MemberDeleteBody = {};
export type MemberDeleteResponse = {};

async function handler(
  req: ApiRequestProps<MemberDeleteBody, MemberDeleteQuery>,
  res: ApiResponseType<any>
): Promise<MemberDeleteResponse> {
  const { tmbId: memberId } = req.query;
  const { teamId, tmbId } = await authCert({ req, authToken: true });

  // get member permission
  const member = await getTeamMember({
    teamId,
    tmbId: memberId
  });

  if (member.permission.hasManagePer) {
    await authMemberPermission({ teamId, tmbId, permission: OwnerPermissionVal });
  } else {
    await authMemberPermission({ teamId, tmbId, permission: TeamManagePermissionVal });
  }

  await removeUserFromTeam({
    teamId,
    memberId
  });

  (async () => {
    const memberName = await MongoTeamMember.findOne({ _id: memberId }, { name: 1 })
      .lean()
      .then((doc) => {
        if (!doc) {
          throw new Error('Member not found');
        }
        return doc.name;
      });

    addOperationLog({
      tmbId,
      teamId,
      event: OperationLogEventEnum.KICK_OUT_TEAM,
      params: {
        memberName: memberName
      }
    });
  })();

  return {};
}

export default NextAPI(handler);
