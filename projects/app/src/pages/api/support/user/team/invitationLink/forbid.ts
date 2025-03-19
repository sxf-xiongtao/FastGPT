import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { authUserPer } from '@fastgpt/service/support/permission/user/auth';
import { TeamManagePermissionVal } from '@fastgpt/global/support/permission/user/constant';
import { MongoInvitationLink } from '@fastgpt/service/support/user/team/invitationLink/schema';

export type ForbidLinkQuery = {};
export type ForbidLinkBody = {
  linkId: string;
};
export type ForbidLinkResponse = {};

async function handler(
  req: ApiRequestProps<ForbidLinkBody, ForbidLinkQuery>,
  _res: ApiResponseType<any>
): Promise<ForbidLinkResponse> {
  const { teamId } = await authUserPer({ req, authToken: true, per: TeamManagePermissionVal });
  const { linkId } = req.body;
  await MongoInvitationLink.updateOne(
    { linkId, teamId },
    { forbidden: true, expires: new Date() } // set the forbidden status and expires time as now
  );
  return {};
}
export default NextAPI(handler);
