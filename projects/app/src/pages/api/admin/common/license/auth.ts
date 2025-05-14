import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { adminCert } from '@/service/support/permission/adminCert';
import { jsonRes } from '@fastgpt/service/common/response';

export type LicenseAuthQuery = {};
export type LicenseAuthBody = {};
export type LicenseAuthResponse = any;

async function handler(
  req: ApiRequestProps<LicenseAuthBody, LicenseAuthQuery>,
  res: ApiResponseType<any>
): Promise<LicenseAuthResponse> {
  // 未激活状态
  if (!global.licenseData) {
    jsonRes(res);
    return;
  }

  try {
    await adminCert({ req, authToken: true });

    return jsonRes(res, {
      data: global.licenseData
    });
  } catch (error) {
    // 未登录，仅返回一个数据
    return jsonRes(res, {
      data: {
        company: global.licenseData.company
      }
    });
  }
}
export default handler;
