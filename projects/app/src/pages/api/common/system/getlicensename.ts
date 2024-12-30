import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';

export type getlicensenameQuery = {};

export type getlicensenameBody = {};

export type getlicensenameResponse = {};

async function handler(
  req: ApiRequestProps<getlicensenameBody, getlicensenameQuery>,
  res: ApiResponseType<any>
): Promise<getlicensenameResponse> {
  return {
    name: global.licenseData.company
  };
}

export default NextAPI(handler);
