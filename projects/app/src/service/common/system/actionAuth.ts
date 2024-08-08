import axios from 'axios';
import { addLog } from '@fastgpt/service/common/system/log';
import { Obj2Query } from '@/utils/tools';
import { AuthGoogleTokenProps } from '@fastgpt/global/common/system/api';

// service run
export const authGoogleToken = async (data: AuthGoogleTokenProps) => {
  if (!global.systemConfig?.auth?.googleServiceVerKey) return;

  const res = await axios.post<{
    score?: number;
    success: boolean;
    'error-codes': string[];
  }>(
    `https://www.recaptcha.net/recaptcha/api/siteverify?${Obj2Query({
      secret: global.systemConfig?.auth?.googleServiceVerKey,
      response: data.googleToken,
      remoteip: data.remoteip
    })}`
  );

  addLog.info('谷歌校验结果', res?.data);

  if (res.data.success) {
    return Promise.resolve('');
  }

  return Promise.reject('您的操作环境存在异常，请刷新页面后重试或联系客服。');
};
