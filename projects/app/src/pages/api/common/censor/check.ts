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

  const customURL = global.systemConfig.censor?.customCensorURL;

  const result = await (async () =>
    customURL ? censorCheckCustom(text) : censorCheckBaidu(text))();

  return {
    code: result.code || 200,
    message: result.message
  };
}

export default NextAPI(handler);
