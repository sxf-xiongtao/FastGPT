import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { authMember } from '@/service/support/permission/team/auth';
import { ReadPermissionVal } from '@fastgpt/global/support/permission/constant';
import { MongoTeamInvoiceTitle } from '@/service/support/user/team/invoiceAccount/teamInvoiceSchema';

export type getTeamInvoiceHeaderQuery = {};

export type getTeamInvoiceHeaderBody = {};

export type getTeamInvoiceHeaderResponse = {};

async function handler(
  req: ApiRequestProps<getTeamInvoiceHeaderBody, getTeamInvoiceHeaderQuery>,
  res: ApiResponseType<any>
): Promise<getTeamInvoiceHeaderResponse> {
  const { teamId } = await authMember({ req, authToken: true, per: ReadPermissionVal });
  const invoiceHeader = await MongoTeamInvoiceTitle.findOne({ teamId }).lean();
  return invoiceHeader || {};
}

export default NextAPI(handler);
