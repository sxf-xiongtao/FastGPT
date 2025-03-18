import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { MongoInvitationLink } from '@fastgpt/service/support/user/team/invitationLink/schema';
import { TeamErrEnum } from '@fastgpt/global/common/error/code/team';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { parseHeaderCert } from '@fastgpt/service/support/permission/controller';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import { TeamMemberStatusEnum } from '@fastgpt/global/support/user/team/constant';
import { checkTeamMaxMembersPermission } from '@/service/support/permission/teamLimit';

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
  const { userId } = await parseHeaderCert({ req, authToken: true });

  // Check link valid
  const invitation = await MongoInvitationLink.findOne({ _id: linkId }).lean();
  if (!invitation) {
    return Promise.reject(TeamErrEnum.invitationLinkInvalid);
  }

  if (invitation.forbidden || invitation.expires < new Date()) {
    return Promise.reject(TeamErrEnum.invitationLinkInvalid);
  }

  if (invitation.usedTimesLimit === 1 && invitation.members.length !== 0) {
    return Promise.reject(TeamErrEnum.invitationLinkInvalid);
  }

  await checkTeamMaxMembersPermission(invitation.teamId, 1);

  // Check user exist in team
  // const usersTeamIds = (
  //   await MongoTeamMember.find({ userId, status: notLeaveStatus }).select('teamId').lean()
  // ).map((i) => String(i.teamId));
  // if (usersTeamIds.includes(String(invitation.teamId))) {
  //   return Promise.reject(TeamErrEnum.youHaveBeenInTheTeam);
  // }

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
      { _id: linkId },
      {
        $set: {
          members: invitation.members.includes(String(result._id))
            ? invitation.members
            : invitation.members.concat([String(result._id)])
        }
      },
      {
        session
      }
    );
  });

  return {};
}
export default NextAPI(handler);
