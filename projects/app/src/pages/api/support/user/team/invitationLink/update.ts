import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { InvitationLinkUpdateType } from '@fastgpt/service/support/user/team/invitationLink/type';
import { authUserPer } from '@fastgpt/service/support/permission/user/auth';
import { TeamManagePermissionVal } from '@fastgpt/global/support/permission/user/constant';
import { MongoInvitationLink } from '@fastgpt/service/support/user/team/invitationLink/schema';
export type UpdateInvitationLinkQuery = {};
export type UpdateInvitationLinkBody = InvitationLinkUpdateType;
export type UpdateInvitationLinkResponse = {};
async function handler(
  req: ApiRequestProps<UpdateInvitationLinkBody, UpdateInvitationLinkQuery>,
  _res: ApiResponseType<any>
): Promise<UpdateInvitationLinkResponse> {
  const { teamId } = await authUserPer({ req, authToken: true, per: TeamManagePermissionVal });
  const { linkId, forbidden } = req.body;
  if (forbidden) {
    await MongoInvitationLink.updateOne(
      { _id: linkId, teamId },
      { forbidden, expires: new Date() } // set the forbidden status and expires time as now
    );
  }
  return {};
}
export default NextAPI(handler);
