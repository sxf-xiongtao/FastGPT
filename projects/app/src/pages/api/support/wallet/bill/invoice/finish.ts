import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { MongoInvoice } from '@/service/support/wallet/bill/invoiceSchema';
import { sendEmail } from '@/service/support/user/inform/sendMessage';
import { getUploadModel } from '@fastgpt/service/common/file/multer';
import { readFileSync } from 'fs';
import { removeFilesByPaths } from '@fastgpt/service/common/file/utils';
import { jsonRes } from '@fastgpt/service/common/response';
import { InvoiceStatusEnum } from '@fastgpt/global/support/wallet/bill/invoice/constants';
export type finishQuery = {};

export type finishBody = {};

export type finishResponse = {};

async function handler(
  req: ApiRequestProps<finishBody, finishQuery>,
  res: ApiResponseType<any>
): Promise<finishResponse> {
  const filePaths: string[] = [];
  try {
    const upload = getUploadModel({
      maxSize: (global.feConfigs?.uploadFileMaxSize || 500) * 1024 * 1024
    });

    const { file, metadata } = await upload.doUpload(req, res);
    filePaths.push(file.path);

    const fileData = readFileSync(file.path);
    await MongoInvoice.updateOne(
      { _id: metadata.invoiceId },
      { $set: { status: InvoiceStatusEnum.completed, finishTime: new Date(), file: fileData } }
    );
  } catch (error) {
    jsonRes(res, {
      code: 500,
      error
    });
  }

  removeFilesByPaths(filePaths);
  return {};
}

export default NextAPI(handler);
export const config = {
  api: {
    bodyParser: false
  }
};
