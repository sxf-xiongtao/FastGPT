import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { censorCheckCustom } from '@/service/common/censor/custom';
import { censorCheckBaidu } from '@/service/common/censor/baidu';

export type CustomCensorCheckQuery = {};
export type CustomCensorCheckBody = {
  text: string;
};
export type CustomCensorCheckResponse = {
  code: number;
  message?: string;
};

async function handler(
  req: ApiRequestProps<CustomCensorCheckBody, CustomCensorCheckQuery>,
  _res: ApiResponseType<any>
): Promise<CustomCensorCheckResponse> {
  await authCert({ req, authRoot: true });

  return censorCheckRequest(req.body);
}

export default NextAPI(handler);

export const censorCheckRequest = ({
  text
}: CustomCensorCheckBody): Promise<CustomCensorCheckResponse> => {
  try {
    if (global.systemConfig.censor?.customCensorURL) {
      return censorCheckCustom(text);
    }

    return censorCheckBaidu(text);
  } catch (error) {
    return Promise.resolve({
      code: 200
    });
  }
};
