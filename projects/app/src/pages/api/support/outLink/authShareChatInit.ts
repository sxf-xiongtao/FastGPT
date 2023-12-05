import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import type { AuthShareChatInitProps } from '@fastgpt/global/support/outLink/api.d';
import axios from 'axios';
import { TokenAuthResponseType } from '@/service/support/outLink/auth';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { OutLinkErrEnum } from '@fastgpt/global/common/error/code/outLink';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    await authCert({ req, authRoot: true });
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
        throw new Error(data?.message || data?.msg || OutLinkErrEnum.unAuthUser);
      }
    } catch (error) {
      throw new Error(OutLinkErrEnum.unAuthUser);
    }

    jsonRes(res);
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
