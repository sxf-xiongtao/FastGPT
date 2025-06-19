import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { InvitationLinkCreateType } from '@fastgpt/service/support/user/team/invitationLink/type';
import { authUserPer } from '@fastgpt/service/support/permission/user/auth';
import { TeamManagePermissionVal } from '@fastgpt/global/support/permission/user/constant';
import { MongoInvitationLink } from '@/service/support/user/team/invitationLink/schema';
import { addDays, addMinutes, addYears } from 'date-fns';
import { TeamErrEnum } from '@fastgpt/global/common/error/code/team';
import { MaxInvitationLinksAmount } from '@fastgpt/service/support/user/team/invitationLink/constants';
import { addAuditLog } from '@fastgpt/service/support/user/audit/util';
import { AuditEventEnum } from '@fastgpt/global/support/user/audit/constants';

export type CreateInvitationLinkQuery = {};
export type CreateInvitationLinkBody = InvitationLinkCreateType;
export type CreateInvitationLinkResponse = string;

async function handler(
  req: ApiRequestProps<CreateInvitationLinkBody, CreateInvitationLinkQuery>,
  _res: ApiResponseType<any>
): Promise<CreateInvitationLinkResponse> {
  const { expires, description, usedTimesLimit } = req.body;

  const { teamId, tmbId } = await authUserPer({
    req,
    authToken: true,
    per: TeamManagePermissionVal
  });

  const amount = await MongoInvitationLink.countDocuments({
    teamId,
    $or: [
      {
        forbidden: false
      },
      {
        forbidden: { $exists: false }
      }
    ],
    expires: { $gt: new Date() }
  });
  if (amount >= MaxInvitationLinksAmount) {
    return Promise.reject(TeamErrEnum.tooManyInvitations);
  }

  const invitationLink = await MongoInvitationLink.create({
    teamId,
    description,
    usedTimesLimit,
    expires: (() => {
      // expires could be: 30m, 7d, 1y
      if (expires === '30m') {
        return addMinutes(new Date(), 30);
      }
      if (expires === '7d') {
        return addDays(new Date(), 7);
      }
      if (expires === '1y') {
        return addYears(new Date(), 1);
      }
      return addDays(new Date(), 7);
    })()
  });

  addAuditLog({
    tmbId,
    teamId,
    event: AuditEventEnum.CREATE_INVITATION_LINK,
    params: {
      link: invitationLink.description
    }
  });

  return invitationLink.linkId;
}

export default NextAPI(handler);
