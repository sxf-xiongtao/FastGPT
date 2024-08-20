import axios from 'axios';
import { addLog } from '@fastgpt/service/common/system/log';

export const censorCheckBaidu = async (text: string) => {
  if (!global.systemConfig?.censor?.BAIDU_TEXT_CENSOR_CLIENTID) {
    return {
      code: 200
    };
  }

  const time = Date.now();

  // 将字符串分成最多 7000 长度一组，多组的话，分别发出校验请求
  const textList = (() => {
    const list: string[] = [];
    for (let i = 0; i < text.length; i += 7000) {
      list.push(text.slice(i, i + 7000));
    }
    return list;
  })();

  const responseList = await Promise.all(textList.map(sendTextCensor));
  const errResponse = responseList.find((item) => item.code);

  const response = {
    code: errResponse?.code || 200,
    message: errResponse?.message
  };

  console.log(`安全校验, 长度: ${text.length},时间: ${Date.now() - time}ms `);

  return response;
};

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
      console.log('违规关键词', hitsWord);

      return {
        code: 5000,
        message: `${data.data?.[0]?.msg || '您的内容不合规'}`
      };
    }

    return {
      message: 'SUCCESS'
    };
  } catch (err) {
    addLog.warn('百度内容安全校验异常', { err });
    return {
      message: '百度内容安全校验异常'
    };
  }
}
