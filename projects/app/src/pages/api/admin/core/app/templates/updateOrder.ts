import { MongoAppTemplate } from '@fastgpt/service/core/app/templates/templateSchema';
import { adminCert } from '@/service/support/permission/adminCert';
import { NextAPI } from '@/service/middleware/entry';
import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';

export type updateTemplateOrderQuery = {};

export type updateTemplateOrderBody = {
  templates: {
    templateId: string;
    order: number;
  }[];
};

export type updateTemplateOrderResponse = {};

async function handler(
  req: ApiRequestProps<updateTemplateOrderBody, updateTemplateOrderQuery>,
  res: ApiResponseType<updateTemplateOrderResponse>
): Promise<updateTemplateOrderResponse> {
  await adminCert({ req, authToken: true });

  const { templates } = req.body;

  await MongoAppTemplate.bulkWrite(
    templates.map((template, index) => ({
      updateOne: {
        filter: { templateId: template.templateId },
        update: { $set: { order: index } },
        upsert: true
      }
    }))
  );

  return {};
}

export default NextAPI(handler);
