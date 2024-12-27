import { ApiRequestProps } from '@fastgpt/service/type/next';

import { ApiResponseType } from '@fastgpt/service/type/next';
import { MongoAppTemplate } from '@fastgpt/service/core/app/templates/templateSchema';

import { adminCert } from '@/service/support/permission/adminCert';
import { NextAPI } from '@/service/middleware/entry';
import { isCommunityTemplate } from '@fastgpt/templates/register';
import { AppTemplateSchemaType } from '@fastgpt/global/core/app/type';

export type updateTemplateQuery = {};

export type updateTemplateBody = Omit<
  AppTemplateSchemaType,
  'author' | 'isQuickTemplate' | 'order'
>;
export type updateTemplateResponse = {};

async function handler(
  req: ApiRequestProps<updateTemplateBody, updateTemplateQuery>,
  res: ApiResponseType<any>
): Promise<updateTemplateResponse> {
  await adminCert({ req, authToken: true });
  const { templateId, name, intro, avatar, tags, type, isActive, userGuide, workflow } = req.body;

  const updateData = isCommunityTemplate(templateId)
    ? { isActive, tags, userGuide }
    : { name, intro, avatar, tags, type, isActive, userGuide, workflow };

  await MongoAppTemplate.updateOne({ templateId }, { $set: updateData }, { upsert: true });

  return {};
}

export default NextAPI(handler);
