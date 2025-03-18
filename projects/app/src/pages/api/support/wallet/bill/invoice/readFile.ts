import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { MongoInvoice } from '@/service/support/wallet/bill/invoiceSchema';

export type readFileQuery = {
  id: string;
  teamId: string;
  teamName: string;
  unifiedCreditCode: string;
};

export type readFileBody = {};

export type readFileResponse = {};

async function handler(
  req: ApiRequestProps<readFileBody, readFileQuery>,
  res: ApiResponseType<any>
): Promise<readFileResponse> {
  //   await authCert({ req, authToken: true });

  const { id, teamId, teamName, unifiedCreditCode } = req.query;

  const record = await MongoInvoice.findOne({
    _id: id,
    teamId,
    teamName,
    unifiedCreditCode
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

  return {};
}

export default NextAPI(handler);
