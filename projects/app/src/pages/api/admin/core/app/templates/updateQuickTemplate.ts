import type { ApiResponseType } from '@fastgpt/service/type/next';
import type { ApiRequestProps } from '@fastgpt/service/type/next';

import { adminCert } from '@/service/support/permission/adminCert';
import { MongoAppTemplate } from '@fastgpt/service/core/app/templates/templateSchema';
import { NextAPI } from '@/service/middleware/entry';

export type updateQuickTemplateBody = {
  templateIds: string[];
};

export type updateQuickTemplateResponse = {};

export type updateQuickTemplateQuery = {};

async function handler(
  req: ApiRequestProps<updateQuickTemplateBody, updateQuickTemplateQuery>,
  res: ApiResponseType<updateQuickTemplateResponse>
): Promise<updateQuickTemplateResponse> {
  await adminCert({ req, authToken: true });

  const { templateIds } = req.body;

  await MongoAppTemplate.updateMany({}, [
    {
      $set: {
        isQuickTemplate: {
          $in: ['$templateId', templateIds]
        }
      }
    }
  ]);

  return {};
}

export default NextAPI(handler);
