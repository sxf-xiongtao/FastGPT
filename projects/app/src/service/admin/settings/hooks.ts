import { ConfigStoreType } from '@/global/admin/config';

export function beforeUpdateConfig(
  fastgpt: ConfigStoreType['fastgpt'],
  fastgptPro: ConfigStoreType['fastgptPro']
) {
  // 自动赋值 SSO 配置
  const externalUserSystemBaseUrl = process.env.EXTERNAL_USER_SYSTEM_BASE_URL;
  if (!externalUserSystemBaseUrl) {
    delete fastgpt.feConfigs.sso;

    if (fastgptPro.teamMode === 'sync') {
      fastgptPro.teamMode = 'single'; // reset the teamMode
    }
  } else {
    // Ensure the sso object exists, initialize it if it doesn't
    if (!fastgpt.feConfigs.sso) {
      fastgpt.feConfigs.sso = {};
    }
    fastgpt.feConfigs.sso.url = externalUserSystemBaseUrl;
  }

  fastgpt.feConfigs.show_git = !!process.env.SHOW_GIT;
  fastgpt.feConfigs.show_workorder = !!process.env.WORKORDER_BASE_URL;
}
