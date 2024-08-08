import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { AuthFrequencyLimitProps } from '@fastgpt/global/common/frequenctLimit/type';
import { authFrequencyLimit } from '@/service/common/frequencyLimit/tools';

export type authQuery = {};

async function handler(
  req: ApiRequestProps<AuthFrequencyLimitProps, authQuery>,
  res: ApiResponseType<any>
) {
  try {
    await authFrequencyLimit(req.body);
  } catch (error) {
    return Promise.reject('common.error.too_many_request');
  }
}

export default NextAPI(handler);
