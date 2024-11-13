import axios from 'axios';

interface BaiduConversionConfig {
  token: string;
  endpoint: string;
  baseUrl: string;
}

const config: BaiduConversionConfig = {
  token: process.env.BAIDU_CONVERSION_TOKEN || '',
  endpoint: 'https://ocpc.baidu.com/ocpcapi/api/uploadConvertData',
  baseUrl: 'https://fastgpt.sealos.run/'
};

export const trackBaiduConversion = async (bd_vid: string) => {
  if (!bd_vid || !config.token) return;

  try {
    const postData = {
      token: config.token,
      conversionTypes: [
        {
          logidUrl: `${config.baseUrl}?bd_vid=${bd_vid}`,
          newType: 3
        }
      ]
    };

    const response = await axios.post(config.endpoint, postData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('百度转化追踪成功:', response.data);
    return response.data;
  } catch (error) {
    console.error('百度转化追踪异常:', error);
  }
};
