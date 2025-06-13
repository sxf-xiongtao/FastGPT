import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { MongoInvoice } from '@/service/support/wallet/bill/invoiceSchema';
import { authUserPer } from '@fastgpt/service/support/permission/user/auth';
import { TeamManagePermissionVal } from '@fastgpt/global/support/permission/user/constant';

export type readFileQuery = {
  id: string;
};

export type readFileBody = {};

async function handler(
  req: ApiRequestProps<readFileBody, readFileQuery>,
  res: ApiResponseType<any>
) {
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

  // 返回 PDF 文件
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Cache-Control', 'public, max-age=31536000');
  res.setHeader(
    'Content-Disposition',
    `inline; filename="${encodeURIComponent(record.teamName)}.pdf"`
  );

  const fileBuffer = record.file;
  res.send(fileBuffer);
}

export default NextAPI(handler);
