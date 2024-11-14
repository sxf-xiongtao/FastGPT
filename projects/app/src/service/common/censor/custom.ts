import { addLog } from '@fastgpt/service/common/system/log';
import { i18nT } from '@fastgpt/web/i18n/utils';
import axios from 'axios';

export const censorCheckCustom = async (text: string) => {
  const customURL = global.systemConfig.censor?.customCensorURL;

  const result = await axios.request<{
    success: boolean;
    message: string;
  }>({
    url: customURL,
    method: 'POST',
    data: {
      text
    },
    headers: {
      'Content-Type': 'application/json'
    }
  });
  addLog.debug('censor check failed: ' + result.data.message);
  if (result.data.success) {
    return {
      code: 200
    };
  }
  return {
    code: 5000,
    message: result.data.message
  };
};
