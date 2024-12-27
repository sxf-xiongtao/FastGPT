import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { adminCert } from '@/service/support/permission/adminCert';
import { MongoAppTemplate } from '@fastgpt/service/core/app/templates/templateSchema';

export type deleteTemplateQuery = {
  id: string;
};

export type deleteTemplateBody = {};

export type deleteTemplateResponse = {};

async function handler(
  req: ApiRequestProps<deleteTemplateBody, deleteTemplateQuery>,
  res: ApiResponseType<any>
): Promise<deleteTemplateResponse> {
  await adminCert({ req, authToken: true });

  await MongoAppTemplate.deleteOne({ templateId: req.query.id });

  return {};
}

export default NextAPI(handler);
