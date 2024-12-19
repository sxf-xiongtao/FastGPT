import { ConfigFormType, ConfigStoreType } from '@/global/admin/config';
import { SystemConfigsTypeEnum } from '@fastgpt/global/common/system/config/constants';
import { SubTypeEnum } from '@fastgpt/global/support/wallet/sub/constants';

export function formatConfigStore2FormSchema({
  fastgpt,
  fastgptPro
}: ConfigStoreType): ConfigFormType {
  const {
    feConfigs,
    systemEnv,
    subPlans = {},
    llmModels = [],
    vectorModels = [],
    reRankModels = [],
    audioSpeechModels = [],
    whisperModel = []
  } = fastgpt || { feConfigs: {}, systemEnv: {} };

  // 初始化配置
  const {
    show_emptyChat = false,
    show_team_chat = false,
    show_openai_account = false,
    show_promotion = false,
    favicon = '',
    concatMd = '',
    docUrl = 'https://doc.tryfastgpt.ai',
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
    ...feConfigsProps
  } = feConfigs || {};

  const {
    openapiPrefix = 'openapi',
    vectorMaxProcess = 10,
    qaMaxProcess = 10,
    pgHNSWEfSearch = 100,
    ...systemEnvProps
  } = systemEnv || {};

  return {
    siteSettings: {
      feConfigs: {
        show_emptyChat,
        show_team_chat,
        show_openai_account,
        show_promotion,
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
        ...feConfigsProps
      },
      sso,
      concatMd,
      scripts: JSON.stringify(scripts, null, 2),
      limit,
      navbar: navbarItems || [],
      systemEnv: {
        openapiPrefix,
        vectorMaxProcess,
        qaMaxProcess,
        pgHNSWEfSearch,
        ...systemEnvProps
      }
    },
    modelSettings: {
      llmModels: JSON.stringify(llmModels, null, 2),
      vectorModels: JSON.stringify(vectorModels, null, 2),
      reRankModels: JSON.stringify(reRankModels, null, 2),
      audioSpeechModels: JSON.stringify(audioSpeechModels, null, 2),
      whisperModel: JSON.stringify(whisperModel, null, 2)
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
      dingtalk: {
        clientId: fastgptPro?.auth?.dingtalk?.clientId || '',
        secret: fastgptPro?.auth?.dingtalk?.secret || ''
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
      fastLogin: JSON.stringify(fastgptPro.fastLogin || {}, null, 2)
    },
    paySettings: {
      wx: fastgptPro?.pay?.wx || {},
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
    }
  };
}

export function formatFormData2ConfigStore({
  siteSettings,
  modelSettings,
  loginSettings,
  paySettings,
  securitySettings
}: ConfigFormType): ConfigStoreType {
  const { feConfigs, systemEnv, concatMd, scripts, limit, sso, navbar } = siteSettings;
  const { llmModels, vectorModels, reRankModels, audioSpeechModels, whisperModel } = modelSettings;
  const { email, phone, github, wechat, dingtalk, google, fastLogin, sms, microsoft } =
    loginSettings;
  const { censor } = securitySettings;
  const { wx, subPlans } = paySettings;

  const formatFeConfig = {
    ...feConfigs,
    concatMd,
    scripts: scripts ? JSON.parse(scripts) : [],
    limit,
    oauth: {
      github: github?.clientId,
      google: google?.clientId,
      dingtalk: dingtalk?.clientId,
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
    register_method: (() => {
      const methods = [];
      if (loginSettings?.email?.register) {
        methods.push('email');
      }
      if (loginSettings?.sms?.REGISTER) {
        methods.push('phone');
      }
      return methods;
    })() as ['email' | 'phone'],
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
      if (loginSettings?.sms?.BIND_NOTIFICATION) {
        return ['email', 'phone'];
      }
      return ['email'];
    })() as ['email' | 'phone'],
    navbarItems: Array.isArray(navbar) ? navbar : []
  };

  const formatLoginSettings = {
    email,
    phone,
    github,
    wechat,
    dingtalk,
    google,
    microsoft,
    sms
  };

  const standardSubPlanJson = (() => {
    try {
      return JSON.parse(subPlans.standard);
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
      },
      llmModels: JSON.parse(llmModels),
      vectorModels: JSON.parse(vectorModels),
      reRankModels: JSON.parse(reRankModels),
      audioSpeechModels: JSON.parse(audioSpeechModels),
      whisperModel: JSON.parse(whisperModel)
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
      pay: {
        wx
      }
    }
  };
}
