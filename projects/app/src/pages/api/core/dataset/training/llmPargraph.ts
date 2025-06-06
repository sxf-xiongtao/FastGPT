import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { llmPargraph } from '@/service/core/dataset/training/llmPargraph';
import { authCert } from '@fastgpt/service/support/permission/auth/common';

export type llmPargraphQuery = {};

export type llmPargraphBody = {
  rawText: string;
  model: string;
  billId: string;
};

export type llmPargraphResponse = {
  resultText: string;
  totalInputTokens: number;
  totalOutputTokens: number;
};

async function handler(
  req: ApiRequestProps<llmPargraphBody, llmPargraphQuery>,
  res: ApiResponseType<any>
): Promise<llmPargraphResponse> {
  await authCert({ req, authRoot: true });

  const { rawText, model } = req.body;
  const result = await llmPargraph({ rawText, model });

  return result;
}

export default NextAPI(handler);
