import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import type { TeamInvoiceHeaderType } from '@fastgpt/global/support/user/team/type';
import { MongoTeamInvoiceTitle } from '@/service/support/user/team/invoiceAccount/teamInvoiceSchema';
import { authMember } from '@/service/support/permission/team/auth';
import { OwnerPermissionVal } from '@fastgpt/global/support/permission/constant';

export type updateQuery = {};

export type updateBody = TeamInvoiceHeaderType;

export type updateResponse = {};

async function handler(
  req: ApiRequestProps<updateBody, updateQuery>,
  res: ApiResponseType<any>
): Promise<updateResponse> {
  const { teamId } = await authMember({ req, authToken: true, per: OwnerPermissionVal });
  const handleRes = await MongoTeamInvoiceTitle.updateOne({ teamId }, req.body, {
    upsert: true
  });
  if (handleRes) return {};
  return Promise.reject('update fail');
}

export default NextAPI(handler);
