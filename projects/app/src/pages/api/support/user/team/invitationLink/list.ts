import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { TeamManagePermissionVal } from '@fastgpt/global/support/permission/user/constant';
import { authUserPer } from '@fastgpt/service/support/permission/user/auth';
import { MongoInvitationLink } from '@/service/support/user/team/invitationLink/schema';
import { InvitationType } from '@fastgpt/service/support/user/team/invitationLink/type';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';

export type InvitationLinkListQuery = {};
export type InvitationLinkListBody = {};
export type InvitationLinkListResponse = InvitationType[];

async function handler(
  req: ApiRequestProps<InvitationLinkListBody, InvitationLinkListQuery>,
  _res: ApiResponseType<any>
): Promise<InvitationLinkListResponse> {
  const { teamId } = await authUserPer({ req, authToken: true, per: TeamManagePermissionVal });
  const invitationLinks = (
    await MongoInvitationLink.find({ teamId })
      .sort({
        forbidden: 1,
        expires: -1
      })
      .lean()
  ).map((i) => ({
    ...i,
    members: i.members
  }));
  const tmbIds = invitationLinks.flatMap((i) => i.members).map((i) => String(i));
  // deduplicate
  const tmbs = await MongoTeamMember.find({ teamId, _id: { $in: tmbIds } }).lean();
  return invitationLinks.map((link) => ({
    ...link,
    members: link.members.map((j) => {
      const tmb = tmbs.find((k) => String(k._id) === j)!;
      return {
        tmbId: String(tmb._id),
        avatar: tmb.avatar,
        name: tmb.name
      };
    })
  }));
}

export default NextAPI(handler);
