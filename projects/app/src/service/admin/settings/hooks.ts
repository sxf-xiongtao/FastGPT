import { ConfigStoreType } from '@/global/admin/config';
import axios from 'axios';

async function checkSSOURL() {
  try {
    const url = new URL('test', process.env.EXTERNAL_USER_SYSTEM_BASE_URL);
    const res = await axios.get(url.toString());
    if (res.status === 200 && res.data === 'FastGPT-SSO-Service') {
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}

export async function beforeUpdateConfig(
  fastgpt: ConfigStoreType['fastgpt'],
  fastgptPro: ConfigStoreType['fastgptPro']
) {
  if (!process.env.EXTERNAL_USER_SYSTEM_BASE_URL) {
    fastgpt.feConfigs.sso = undefined;
    if (fastgptPro.teamMode === 'sync') fastgptPro.teamMode = 'multi'; // reset the teamMode
  } else {
    fastgpt.feConfigs.sso = {
      ...fastgpt.feConfigs.sso,
      url: process.env.EXTERNAL_USER_SYSTEM_BASE_URL
    };
  }
  fastgpt.feConfigs.show_git = !!process.env.SHOW_GIT;
  fastgpt.feConfigs.show_workorder = !!process.env.WORKORDER_BASE_URL;
}
