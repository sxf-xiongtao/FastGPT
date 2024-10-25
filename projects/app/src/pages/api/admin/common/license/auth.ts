import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { authLicense } from '@/service/core/license';

export type LicenseAuthQuery = {};
export type LicenseAuthBody = {};
export type LicenseAuthResponse = {};

async function handler(
  req: ApiRequestProps<LicenseAuthBody, LicenseAuthQuery>,
  res: ApiResponseType<any>
): Promise<LicenseAuthResponse> {
  return global.licenseData;
}
export default NextAPI(handler);
