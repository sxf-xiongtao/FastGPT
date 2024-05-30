import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import axios from 'axios';
import { connectToDatabase } from '@/service/mongo';
import { setCookie } from '@fastgpt/service/support/permission/controller';
import { usernameLogin } from '@/service/support/user/controller';
import type { FastLoginProps } from '@fastgpt/global/support/user/api';
import { FastLoginAuthResponse } from '@/global/user/login/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  try {
    await connectToDatabase();
    const { code, token } = req.body as FastLoginProps;

    const fastLoginData = global.systemConfig?.fastLogin?.[code];

    if (!fastLoginData) {
      throw new Error('fastLoginData is not exist');
    }

    const { data } = await axios.post<FastLoginAuthResponse>(fastLoginData.authUrl, {
      code,
      token
    });

    if (data?.success !== true) {
      throw new Error(data.message || 'fastLoginData is auth failed');
    }

    if (!data?.data?.username) {
      throw new Error('fastLoginData username is not exist');
    }

    const username = `${code}-${data.data.username}`;

    const { user, token: loginToken } = await usernameLogin({
      username,
      avatar: data.data.avatar
    });

    setCookie(res, loginToken);
    jsonRes(res, {
      data: { user, token: loginToken }
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
