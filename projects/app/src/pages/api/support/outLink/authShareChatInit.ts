import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@/service/response';
import { connectToDatabase } from '@/service/mongo';
import type { AuthShareChatInitProps } from '@fastgpt/support/outLink/auth';
import axios from 'axios';
import { TokenAuthResponseType } from '@/service/support/outLink/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    const { tokenUrl, authToken } = req.body as AuthShareChatInitProps;

    if (!tokenUrl) return jsonRes(res);

    try {
      const { data } = await axios<TokenAuthResponseType>({
        baseURL: tokenUrl,
        url: '/shareAuth/init',
        method: 'POST',
        data: {
          token: authToken
        }
      });
      if (data?.success !== true) {
        throw new Error(data?.message || data?.msg || '身份校验失败');
      }
    } catch (error) {
      throw new Error('身份校验失败');
    }

    jsonRes(res);
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
