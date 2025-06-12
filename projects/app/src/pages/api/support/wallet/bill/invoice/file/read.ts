import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { MongoInvoice } from '@/service/support/wallet/bill/invoiceSchema';
import { authUserPer } from '@fastgpt/service/support/permission/user/auth';
import { TeamManagePermissionVal } from '@fastgpt/global/support/permission/user/constant';
import type { InvoiceFileInfo } from '@fastgpt/global/support/wallet/bill/invoice/type';

export type readFileQuery = {
  id: string;
};

export type readFileBody = {};

async function handler(
  req: ApiRequestProps<readFileBody, readFileQuery>,
  res: ApiResponseType<InvoiceFileInfo>
): Promise<InvoiceFileInfo> {
  // Is the user a team administrator
  const { teamId, permission } = await authUserPer({
    req,
    authToken: true,
    per: TeamManagePermissionVal
  });

  if (!permission.hasManagePer) {
    return Promise.reject('Only team administrators can download invoice files');
  }

  const { id } = req.query;

  const record = await MongoInvoice.findOne({
    _id: id,
    teamId: teamId // Ensure that only invoices of your own team can be accessed.
  });

  if (!record || !record.file) {
    return Promise.reject('Invoice not found');
  }

  const fileBuffer = record.file;
  const base64Data = fileBuffer.toString('base64');
  const filename = `${record.teamName}.pdf`;

  const response: InvoiceFileInfo = {
    data: base64Data,
    mimeType: 'application/pdf',
    filename: filename,
    size: fileBuffer.length
  };

  return response;
}

export default NextAPI(handler);
