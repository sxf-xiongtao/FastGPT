import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { MongoInvitationLink } from '@fastgpt/service/support/user/team/invitationLink/schema';
import { InvitationInfoType } from '@fastgpt/service/support/user/team/invitationLink/type';
import { CommonErrEnum } from '@fastgpt/global/common/error/code/common';
import { authUserPer } from '@fastgpt/service/support/permission/user/auth';
export type InvitationLinkInfoQuery = {
  linkId: string;
};
export type InvitationLinkInfoBody = {};
export type InvitationLinkInfoResponse = InvitationInfoType;

async function handler(
  req: ApiRequestProps<InvitationLinkInfoBody, InvitationLinkInfoQuery>,
  _res: ApiResponseType<any>
): Promise<InvitationLinkInfoResponse> {
  const { linkId } = req.query;

  await authUserPer({
    req,
    authToken: true
  });

  const invitation = await MongoInvitationLink.findOne({ linkId })
    .populate<{ team: { name: string; avatar: string } }>('team')
    .lean();

  if (!invitation) {
    return Promise.reject(CommonErrEnum.fileNotFound);
  }
  return {
    ...invitation,
    teamAvatar: invitation.team.avatar,
    teamName: invitation.team.name
  };
}

export default NextAPI(handler);
