import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { authLicense } from '@/service/core/license';
import { adminCert } from '@/service/support/permission/adminCert';

export type LicenseAuthQuery = {};
export type LicenseAuthBody = {};
export type LicenseAuthResponse = {};

async function handler(
  req: ApiRequestProps<LicenseAuthBody, LicenseAuthQuery>,
  res: ApiResponseType<any>
): Promise<LicenseAuthResponse> {
  await adminCert({ req, authToken: true });

  return global.licenseData;
}
export default NextAPI(handler);
