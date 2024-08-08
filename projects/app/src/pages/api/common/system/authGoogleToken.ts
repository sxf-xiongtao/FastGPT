import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { authGoogleToken } from '@/service/common/system/actionAuth';
import { AuthGoogleTokenProps } from '@fastgpt/global/common/system/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const body = req.body as AuthGoogleTokenProps;

    await authGoogleToken(body);

    jsonRes(res);
  } catch (err: any) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
