import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { MongoInvoice } from '@/service/support/wallet/bill/invoiceSchema';
import { sendEmail } from '@/service/support/user/inform/sendMessage';
import { getUploadModel } from '@fastgpt/service/common/file/multer';
import { readFileSync } from 'fs';
import { removeFilesByPaths } from '@fastgpt/service/common/file/utils';
import { jsonRes } from '@fastgpt/service/common/response';
import { InvoiceStatusEnum } from '@fastgpt/global/support/wallet/bill/invoice/constants';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import { getNanoid } from '@fastgpt/global/common/string/tools';
import { addLog } from '@fastgpt/service/common/system/log';

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
      maxSize: global.feConfigs?.uploadFileMaxSize
    });

    const { file, metadata } = await upload.doUpload(req, res);
    filePaths.push(file.path);

    const fileData = readFileSync(file.path);

    const invoice = await MongoInvoice.findById(metadata.invoiceId);

    if (!invoice) {
      return Promise.reject('找不到发票');
    }

    await mongoSessionRun(async (session) => {
      invoice.status = InvoiceStatusEnum.completed;
      invoice.finishTime = new Date();
      invoice.file = fileData;

      await invoice.save({ session });

      await sendEmail({
        email: invoice.emailAddress,
        subject: `${global.feConfigs.systemTitle} —— 发票已开具`,
        html: '您申请的发票已完成，请注意查收',
        attachments: [
          {
            filename: file.originalname,
            content: fileData,
            contentType: file.mimetype,
            cid: getNanoid()
          }
        ]
      });

      addLog.info('开票完成', {
        name: invoice.teamName,
        emailAddress: invoice.emailAddress
      });
    });
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
