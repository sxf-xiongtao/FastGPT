import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { getWeChatAccessToken } from '@/service/support/user/login/wx';
import type { GetWXLoginQRResponse } from '@fastgpt/global/support/user/login/api';
import { getNanoid } from '@fastgpt/global/common/string/tools';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const access_token = await getWeChatAccessToken();
    if (!access_token) {
      return jsonRes(res, {
        message: 'Failed to authenticate with wechat',
        code: 400,
        data: 'access_token is null'
      });
    }

    const sceneStr = getNanoid(24);

    const ticketInfo: {
      ticket: string;
      expire_seconds: number;
      url: string;
      errcode: number;
      errmsg?: string;
    } = await fetch(
      `https://api.weixin.qq.com/cgi-bin/qrcode/create?access_token=${access_token}`,
      {
        method: 'POST',
        body: JSON.stringify({
          expire_seconds: 1 * 60 * 60, // 1 hour
          action_name: 'QR_STR_SCENE',
          action_info: { scene: { scene_str: sceneStr } }
        })
      }
    ).then((res) => res.json());

    if (!ticketInfo.ticket) {
      throw new Error(ticketInfo.errmsg || 'Failed to get ticket');
    }

    const qrCodeUrl = `https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=${encodeURIComponent(
      ticketInfo.ticket
    )}`;

    return jsonRes<GetWXLoginQRResponse>(res, {
      code: 200,
      data: {
        code: sceneStr,
        codeUrl: qrCodeUrl
      }
    });
  } catch (error) {
    jsonRes(res, {
      code: 500,
      error
    });
  }
}
