import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { MongoInvitationLink } from '@/service/support/user/team/invitationLink/schema';
import { TeamErrEnum } from '@fastgpt/global/common/error/code/team';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { parseHeaderCert } from '@fastgpt/service/support/permission/controller';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import { TeamMemberStatusEnum } from '@fastgpt/global/support/user/team/constant';
import { checkTeamMaxMembersPermission } from '@/service/support/permission/teamLimit';
import { addOperationLog } from '@fastgpt/service/support/operationLog/addOperationLog';
import { OperationLogEventEnum } from '@fastgpt/global/support/operationLog/constants';

export type InvitationLinkAcceptQuery = {};
export type InvitationLinkAcceptBody = {
  linkId: string;
};
export type InvitationLinkAcceptResponse = {};

async function handler(
  req: ApiRequestProps<InvitationLinkAcceptBody, InvitationLinkAcceptQuery>,
  _res: ApiResponseType<any>
): Promise<InvitationLinkAcceptResponse> {
  const { linkId } = req.body;
  const { userId, tmbId } = await parseHeaderCert({ req, authToken: true });

  // Check link valid
  const invitation = await MongoInvitationLink.findOne({ linkId }).lean();
  if (!invitation) {
    return Promise.reject(TeamErrEnum.invitationLinkInvalid);
  }

  if (invitation.forbidden || invitation.expires < new Date()) {
    return Promise.reject(TeamErrEnum.invitationLinkInvalid);
  }

  await checkTeamMaxMembersPermission(invitation.teamId, 1);

  // accept
  await mongoSessionRun(async (session) => {
    const result = await MongoTeamMember.findOneAndUpdate(
      {
        userId,
        teamId: invitation.teamId
      },
      {
        userId,
        teamId: invitation.teamId,
        status: TeamMemberStatusEnum.active
      },
      {
        session,
        upsert: true,
        returnOriginal: false
      }
    );

    if (!result) {
      return Promise.reject('Create team member failed');
    }

    await MongoInvitationLink.updateOne(
      { linkId: linkId },
      {
        $set: {
          members: invitation.members.includes(String(result._id))
            ? invitation.members
            : invitation.members.concat([String(result._id)]),
          ...(invitation.usedTimesLimit === 1 // make it forbidden
            ? {
                forbidden: true,
                expires: new Date()
              }
            : {})
        }
      },
      {
        session
      }
    );
  });

  addOperationLog({
    tmbId,
    teamId: invitation.teamId,
    event: OperationLogEventEnum.JOIN_TEAM,
    params: {
      link: invitation.description
    }
  });

  return {};
}
export default NextAPI(handler);
