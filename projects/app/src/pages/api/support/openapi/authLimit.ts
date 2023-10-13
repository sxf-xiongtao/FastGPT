import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@/service/response';
import { connectToDatabase } from '@/service/mongo';
import type { AuthOpenApiLimitProps } from '@fastgpt/support/openapi/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    const { openApi } = req.body as AuthOpenApiLimitProps;

    // expiredTime already 2 string
    if (openApi?.limit?.expiredTime && new Date(openApi.limit.expiredTime).getTime() < Date.now()) {
      throw new Error(`Key ${openApi.apiKey} is expired`);
    }

    if (
      openApi?.limit?.credit &&
      openApi.limit.credit > -1 &&
      openApi.usage > openApi.limit.credit
    ) {
      throw new Error(`Key ${openApi.apiKey} is over usage`);
    }

    jsonRes(res);
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
