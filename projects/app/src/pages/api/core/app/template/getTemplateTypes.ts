import { NextAPI } from '@/service/middleware/entry';
import { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { MongoTemplateTypes } from '@fastgpt/service/core/app/templates/templateTypeSchema';
import { TemplateTypeSchemaType } from '@fastgpt/global/core/app/type';
export type getTemplateTypesQuery = {};

export type getTemplateTypesBody = {};

export type getTemplateTypesResponse = TemplateTypeSchemaType[];

async function handler(
  req: ApiRequestProps<getTemplateTypesBody, getTemplateTypesQuery>,
  res: ApiResponseType<any>
): Promise<getTemplateTypesResponse> {
  const templateTypes = await MongoTemplateTypes.find().sort({ typeOrder: 1 });

  return templateTypes;
}

export default NextAPI(handler);
