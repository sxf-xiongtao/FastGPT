import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { getAppTemplatesAndLoadThem } from '@fastgpt/templates/register';
import { AppTemplateSchemaType } from '@fastgpt/global/core/app/type';
import { adminCert } from '@/service/support/permission/adminCert';

export type getSystemTemplatesQuery = {};

export type getSystemTemplatesBody = {};

export type getSystemTemplatesResponse = AppTemplateSchemaType[];

async function handler(
  req: ApiRequestProps<getSystemTemplatesBody, getSystemTemplatesQuery>,
  res: ApiResponseType<any>
): Promise<getSystemTemplatesResponse> {
  await adminCert({ req, authToken: true });

  return getAppTemplatesAndLoadThem(true);
}

export default NextAPI(handler);
