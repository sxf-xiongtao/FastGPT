import { ConfigStoreType } from '@/global/admin/config';

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
