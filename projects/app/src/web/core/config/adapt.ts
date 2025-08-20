import type { ConfigFormType, ConfigStoreType } from '@/global/admin/config';
import { SystemConfigsTypeEnum } from '@fastgpt/global/common/system/config/constants';
import type { FastGPTFeConfigsType } from '@fastgpt/global/common/system/types';
import { SubTypeEnum } from '@fastgpt/global/support/wallet/sub/constants';

export function formatConfigStore2FormSchema({
  fastgpt,
  fastgptPro
}: ConfigStoreType): ConfigFormType {
  const { feConfigs, systemEnv, subPlans = {} } = fastgpt || { feConfigs: {}, systemEnv: {} };

  // 初始化配置
  const {
    show_emptyChat = false,
    show_team_chat = false,
    show_openai_account = false,
    show_promotion = false,
    show_workorder = false,
    favicon = '',
    concatMd = '',
    docUrl = 'https://doc.fastgpt.io',
    systemPluginCourseUrl = '',
    openAPIDocUrl = '',
    systemTitle = 'FastAI',
    customApiDomain = '',
    customSharePageDomain = '',
    limit = {
      exportDatasetLimitMinutes: 20,
      websiteSyncLimitMinuted: 60
    },
    scripts = [],
    uploadFileMaxAmount = 15,
    uploadFileMaxSize = 500,
    lafEnv,
    sso,
    navbarItems = [],
    appTemplateCourse = '',
    show_compliance_copywriting = false,
    show_dataset_feishu = true,
    show_dataset_yuque = true,
    show_publish_feishu = true,
    show_publish_dingtalk = true,
    show_publish_offiaccount = true,
    mcpServerProxyEndpoint = '',
    ...feConfigsProps
  } = feConfigs || {};

  const {
    openapiPrefix = 'openapi',
    vectorMaxProcess = 10,
    qaMaxProcess = 10,
    hnswEfSearch = 100,
    oneapiUrl = '',
    chatApiKey = '',
    vlmMaxProcess = 5,
    tokenWorkers = 1,
    customPdfParse,
    ...systemEnvProps
  } = systemEnv || {};

  return {
    siteSettings: {
      feConfigs: {
        show_workorder,
        show_emptyChat,
        show_team_chat,
        show_openai_account,
        show_promotion,
        show_dataset_feishu,
        show_dataset_yuque,
        show_publish_feishu,
        show_publish_dingtalk,
        show_publish_offiaccount,
        favicon,
        docUrl,
        systemPluginCourseUrl,
        openAPIDocUrl,
        systemTitle,
        customApiDomain,
        customSharePageDomain,
        uploadFileMaxAmount,
        uploadFileMaxSize,
        lafEnv,
        appTemplateCourse,
        show_compliance_copywriting,
        mcpServerProxyEndpoint,
        ...feConfigsProps
      },
      concatMd,
      scripts: JSON.stringify(scripts, null, 2),
      limit,
      navbar: navbarItems || [],
      systemEnv: {
        openapiPrefix,
        vectorMaxProcess,
        qaMaxProcess,
        hnswEfSearch,
        oneapiUrl,
        chatApiKey,
        vlmMaxProcess,
        tokenWorkers,
        customPdfParse,
        ...systemEnvProps
      }
    },
    loginSettings: {
      github: {
        clientId: fastgptPro?.auth?.github?.clientId || '',
        secret: fastgptPro?.auth?.github?.secret || ''
      },
      google: {
        clientId: fastgptPro?.auth?.google?.clientId || '',
        secret: fastgptPro?.auth?.google?.secret || ''
      },
      microsoft: {
        clientId: fastgptPro?.auth?.microsoft?.clientId || '',
        secret: fastgptPro?.auth?.microsoft?.secret || '',
        tenantId: fastgptPro?.auth?.microsoft?.tenantId || '',
        customButton: fastgptPro?.auth?.microsoft?.customButton || ''
      },
      email: {
        smtp: fastgptPro?.auth?.email?.smtp || '',
        user: fastgptPro?.auth?.email?.user || '',
        pass: fastgptPro?.auth?.email?.pass || '',
        register: fastgptPro?.auth?.email?.register || false
      },
      sms: {
        REGISTER: fastgptPro?.auth?.sms?.REGISTER || '',
        RESET_PASSWORD: fastgptPro?.auth?.sms?.RESET_PASSWORD || '',
        BIND_NOTIFICATION: fastgptPro?.auth?.sms?.BIND_NOTIFICATION || '',
        EXPIRE_SOON: fastgptPro?.auth?.sms?.EXPIRE_SOON || '',
        EXPIRED: fastgptPro?.auth?.sms?.EXPIRED || '',
        FREE_CLEAN: fastgptPro?.auth?.sms?.FREE_CLEAN || '',
        FREE_CLEANED: fastgptPro?.auth?.sms?.FREE_CLEAN || ''
      },
      phone: {
        SNED_PHONE_ACCESSKEYID: fastgptPro?.auth?.phone?.SNED_PHONE_ACCESSKEYID || '',
        SNED_PHONE_ACCESSSECRET: fastgptPro?.auth?.phone?.SNED_PHONE_ACCESSSECRET || '',
        SNED_PHONE_SIGNNAME: fastgptPro?.auth?.phone?.SNED_PHONE_SIGNNAME || ''
        // SNED_PHONE_TEMPLATE: fastgptPro?.auth?.phone?.SNED_PHONE_TEMPLATE || ''
      },
      wechat: {
        appID: fastgptPro?.auth?.wechat?.appID || '',
        appSecret: fastgptPro?.auth?.wechat?.appSecret || ''
      },
      fastLogin: JSON.stringify(fastgptPro.fastLogin || {}, null, 2),
      teamMode: fastgptPro.teamMode,
      sso
    },
    paySettings: {
      wx: fastgptPro?.pay?.wx || {},
      alipay: fastgptPro?.pay?.alipay || {},
      bank: fastgptPro?.pay?.bank || {},
      subPlans: {
        planDescriptionUrl:
          // @ts-ignore
          subPlans.planDescriptionUrl,
        // @ts-ignore
        standard: JSON.stringify(subPlans[SubTypeEnum.standard], null, 2) || '{}',
        // @ts-ignore
        extraDatasetSizePrice: subPlans[SubTypeEnum.extraDatasetSize]?.price || 0,
        // @ts-ignore
        extraPointsPrice: subPlans[SubTypeEnum.extraPoints]?.price || 0
      }
    },
    securitySettings: {
      censor: {
        BAIDU_TEXT_CENSOR_CLIENTID: fastgptPro?.censor?.BAIDU_TEXT_CENSOR_CLIENTID || '',
        BAIDU_TEXT_CENSOR_CLIENTSECRET: fastgptPro?.censor?.BAIDU_TEXT_CENSOR_CLIENTSECRET || '',
        customCensorURL: fastgptPro?.censor?.customCensorURL || ''
      }
    },
    externalProviderSettings: {
      externalProviderWorkflowVariables: fastgpt?.feConfigs?.externalProviderWorkflowVariables || []
    }
  };
}

export function formatFormData2ConfigStore({
  siteSettings,
  loginSettings,
  paySettings,
  securitySettings,
  externalProviderSettings
}: ConfigFormType): ConfigStoreType {
  const { feConfigs, systemEnv, concatMd, scripts, limit, navbar } = siteSettings;
  const { email, phone, github, wechat, google, fastLogin, sms, microsoft, teamMode, sso } =
    loginSettings;
  const { censor } = securitySettings;
  const { wx, alipay, bank, subPlans } = paySettings;
  const { externalProviderWorkflowVariables } = externalProviderSettings;

  const formatFeConfig: FastGPTFeConfigsType = {
    ...feConfigs,
    concatMd,
    scripts: scripts ? JSON.parse(scripts) : [],
    limit,
    oauth: {
      github: github?.clientId,
      google: google?.clientId,
      wechat: wechat?.appID,
      microsoft: microsoft?.clientId
        ? {
            clientId: microsoft?.clientId,
            tenantId: microsoft?.tenantId,
            customButton: microsoft?.customButton
          }
        : undefined
    },
    sso,
    payConfig: {
      wx: !!wx?.WX_PRIVATE_KEY,
      alipay: !!alipay?.ALIPAY_ROOT_CERT_CONTENT,
      bank: !!bank?.description
    },
    register_method: (() => {
      const methods = [];
      if (loginSettings.teamMode === 'sync') {
        methods.push('sync');
      }
      if (loginSettings?.email?.register) {
        methods.push('email');
      }
      if (loginSettings?.sms?.REGISTER) {
        methods.push('phone');
      }
      return methods;
    })() as ['email' | 'phone' | 'sync'],
    login_method: (() => {
      const methods = [];
      if (loginSettings?.email?.register) {
        methods.push('email');
      }
      if (loginSettings?.sms?.REGISTER) {
        methods.push('phone');
      }
      return methods;
    })() as ['email' | 'phone'],
    find_password_method: (() => {
      const methods = [];
      if (loginSettings?.email?.register) {
        methods.push('email');
      }
      if (loginSettings?.sms?.RESET_PASSWORD) {
        methods.push('phone');
      }
      return methods;
    })() as ['email' | 'phone'],
    bind_notification_method: (() => {
      const methods = [];
      if (email?.smtp) {
        methods.push('email');
      }
      if (loginSettings?.sms?.BIND_NOTIFICATION) {
        methods.push('phone');
      }
      return methods;
    })() as ['email' | 'phone'],
    navbarItems: Array.isArray(navbar) ? navbar : [],
    externalProviderWorkflowVariables
  };

  formatFeConfig.show_pay = !!(
    formatFeConfig.payConfig?.wx ||
    formatFeConfig.payConfig?.alipay ||
    formatFeConfig.payConfig?.bank
  );

  const formatLoginSettings = {
    email,
    phone,
    wechat,
    github,
    google,
    microsoft,
    sms
  };

  const standardSubPlanJson = (() => {
    try {
      return JSON.parse(subPlans.standard || '{}');
    } catch (error) {
      return {};
    }
  })();

  return {
    [SystemConfigsTypeEnum.fastgpt]: {
      feConfigs: formatFeConfig,
      systemEnv,
      subPlans: {
        planDescriptionUrl: subPlans.planDescriptionUrl ?? '',
        [SubTypeEnum.standard]: standardSubPlanJson,
        [SubTypeEnum.extraDatasetSize]: {
          price: subPlans.extraDatasetSizePrice || 0
        },
        [SubTypeEnum.extraPoints]: {
          price: subPlans.extraPointsPrice || 0
        }
      }
    },
    [SystemConfigsTypeEnum.fastgptPro]: {
      auth: formatLoginSettings,
      censor,
      fastLogin: (() => {
        try {
          return JSON.parse(fastLogin);
        } catch (error) {
          return {};
        }
      })(),
      teamMode,
      pay: {
        wx,
        alipay,
        bank
      }
    }
  };
}
