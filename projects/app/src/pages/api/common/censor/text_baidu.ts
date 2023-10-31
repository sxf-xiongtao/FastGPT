import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import axios from 'axios';
import { authUser } from '@fastgpt/service/support/user/auth';
import { connectToDatabase } from '@/service/mongo';
import { getErrText } from '@/utils/tools';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();

    if (!global.systemConfig?.censor?.BAIDU_TEXT_CENSOR_CLIENTID) {
      return jsonRes(res, {
        data: {
          message: 'success'
        }
      });
    }

    const { text } = req.body as { text: string };
    if (!text) {
      return jsonRes(res, {
        message: 'SUCCESS'
      });
    }

    await authUser({ req, authRoot: true });

    const time = Date.now();

    const response = await sendTextCensor(text);

    console.log(`安全校验, 长度: ${text.length},时间: ${Date.now() - time}ms `);

    jsonRes(res, {
      data: response
    });
  } catch (error) {
    jsonRes(res, {
      data: getErrText(error, '内容安全校验不通过')
    });
  }
}

// 获取access_token
async function getAccessToken() {
  const url = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${global.systemConfig?.censor?.BAIDU_TEXT_CENSOR_CLIENTID}&client_secret=${global.systemConfig?.censor?.BAIDU_TEXT_CENSOR_CLIENTSECRET}`;
  const response = await axios.post(url);

  console.log('获取百度内容安全 token', response.data.access_token);

  return response.data.access_token;
}

// 发出请求
async function sendTextCensor(text: string): Promise<{
  code?: number;
  message: string;
}> {
  try {
    const accessToken = global.store.BAIDU_TEXT_CENSOR_TOKEN;
    const requestUrl = `https://aip.baidubce.com/rest/2.0/solution/v1/text_censor/v2/user_defined?access_token=${accessToken}`;

    const { data } = await axios.post(
      requestUrl,
      { text },
      { headers: { 'content-type': 'application/x-www-form-urlencoded' } }
    );

    if (data.error_code === 110) {
      global.store.BAIDU_TEXT_CENSOR_TOKEN = await getAccessToken();
      return sendTextCensor(text);
    }

    if (data.error_code === 282909) {
      console.log('内容太长了', text.length);
      return {
        message: 'SUCCESS'
      };
    }

    const hitsWord = data?.data?.[0]?.hits?.[0]?.words;

    if (hitsWord) {
      console.log('违规关键词', data?.data?.[0]?.hits?.[0]?.words);

      return {
        code: 5000,
        message: `${data.data?.[0]?.msg || '您的内容不合规'}`
      };
    }

    return {
      message: 'SUCCESS'
    };
  } catch (err) {
    console.log('百度内容安全校验异常');
    console.log(err);
    return {
      message: '百度内容安全校验异常'
    };
  }
}
