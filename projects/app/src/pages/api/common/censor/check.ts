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
  const { text } = req.body;
  await authCert({ req, authRoot: true });

  try {
    if (global.systemConfig.censor?.customCensorURL) {
      return censorCheckCustom(text);
    }

    return censorCheckBaidu(text);
  } catch (error) {
    return {
      code: 200
    };
  }
}

export default NextAPI(handler);
