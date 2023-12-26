import { ConfigFormType, ConfigStoreType } from '@/global/admin/config';
import { SystemConfigsTypeEnum } from '@fastgpt/global/common/system/config/constants';

export function formatConfigStore2FormSchema({
  fastgpt,
  fastgptPro
}: ConfigStoreType): ConfigFormType {
  const {
    feConfigs: {
      show_emptyChat = false,
      show_git = false,
      show_openai_account = false,
      show_promotion = false,
      favicon = '',
      concatMd = '',
      docUrl = 'https://doc.fastgpt.in',
      chatbotUrl = '',
      openAPIDocUrl = '',
      systemTitle = 'FastAI',
      limit = {
        exportLimitMinutes: 20
      }
    },
    chatModels = [],
    qaModels = [],
    cqModels = [],
    extractModels = [],
    qgModels = [],
    vectorModels = [],
    reRankModels = [],
    audioSpeechModels = [],
    whisperModel
  } = fastgpt || { feConfigs: {} };

  return {
    fastgpt: {
      feConfigs: {
        switches: {
          show_emptyChat,
          show_git,
          show_openai_account,
          show_promotion
        },
        images: { favicon },
        concatMd,
        docUrl,
        chatbotUrl,
        openAPIDocUrl,
        systemTitle,
        limit
      },
      models: {
        chatModels: JSON.stringify(chatModels, null, 2),
        qaModels: JSON.stringify(qaModels, null, 2),
        cqModels: JSON.stringify(cqModels, null, 2),
        extractModels: JSON.stringify(extractModels, null, 2),
        qgModels: JSON.stringify(qgModels, null, 2),
        vectorModels: JSON.stringify(vectorModels, null, 2),
        reRankModels: JSON.stringify(reRankModels, null, 2),
        audioSpeechModels: JSON.stringify(audioSpeechModels, null, 2),
        whisperModel: JSON.stringify(whisperModel, null, 2)
      }
    },
    fastgptPro: {
      system: {
        fastgpt_domain: fastgptPro?.system.fastgpt_domain || '',
        userDefaultBalance: fastgptPro?.system.userDefaultBalance || 3,
        teamDefaultMaxMember: fastgptPro?.system.teamDefaultMaxMember || 10
      },
      censor: {
        BAIDU_TEXT_CENSOR_CLIENTID: fastgptPro?.censor?.BAIDU_TEXT_CENSOR_CLIENTID || '',
        BAIDU_TEXT_CENSOR_CLIENTSECRET: fastgptPro?.censor?.BAIDU_TEXT_CENSOR_CLIENTSECRET || ''
      },
      pay: {
        wx: {
          WX_APPID: fastgptPro?.pay?.wx?.WX_APPID || '',
          WX_MCHID: fastgptPro?.pay?.wx?.WX_MCHID || '',
          WX_SERIAL_NO: fastgptPro?.pay?.wx?.WX_SERIAL_NO || '',
          WX_V3_CODE: fastgptPro?.pay?.wx?.WX_V3_CODE || '',
          WX_NOTIFY_URL: fastgptPro?.pay?.wx?.WX_NOTIFY_URL || '',
          WX_PRIVATE_KEY: fastgptPro?.pay?.wx?.WX_PRIVATE_KEY || ''
        }
      },
      auth: {
        googleV3Ver: {
          clientKey: fastgpt?.feConfigs?.googleClientVerKey || '',
          serviceKey: fastgptPro?.auth?.googleServiceVerKey || ''
        },
        github: {
          clientId: fastgptPro?.auth?.github?.clientId || '',
          secret: fastgptPro?.auth?.github?.secret || ''
        },
        google: {
          clientId: fastgptPro?.auth?.google?.clientId || '',
          secret: fastgptPro?.auth?.google?.secret || ''
        },
        email: {
          service: fastgptPro?.auth?.email?.service || '',
          user: fastgptPro?.auth?.email?.user || '',
          pass: fastgptPro?.auth?.email?.pass || ''
        },
        phone: {
          SNED_PHONE_ACCESSKEYID: fastgptPro?.auth?.phone?.SNED_PHONE_ACCESSKEYID || '',
          SNED_PHONE_ACCESSSECRET: fastgptPro?.auth?.phone?.SNED_PHONE_ACCESSSECRET || '',
          SNED_PHONE_SIGNNAME: fastgptPro?.auth?.phone?.SNED_PHONE_SIGNNAME || '',
          SNED_PHONE_TEMPLATE: fastgptPro?.auth?.phone?.SNED_PHONE_TEMPLATE || ''
        }
      }
    }
  };
}

export function formatFormData2ConfigStore({
  fastgpt: {
    feConfigs: {
      switches,
      images,
      concatMd,
      docUrl,
      chatbotUrl,
      openAPIDocUrl,
      systemTitle,
      limit
    },
    models
  },
  fastgptPro
}: ConfigFormType): ConfigStoreType {
  console.log({
    fastgpt: {
      feConfigs: {
        switches,
        images,
        concatMd,
        docUrl,
        chatbotUrl,
        openAPIDocUrl,
        systemTitle,
        limit
      },
      models
    },
    fastgptPro
  });

  // format models
  const formatModels: Record<string, any> = {};
  for (const key in models) {
    // @ts-ignore
    formatModels[key] = models[key] ? JSON.parse(models[key]) : undefined;
  }
  // format feConfigs
  const formatFeConfig: ConfigStoreType['fastgpt']['feConfigs'] = {
    ...switches,
    ...images,
    concatMd,
    docUrl,
    chatbotUrl,
    openAPIDocUrl,
    systemTitle,
    limit,
    // auto set field
    show_pay: !!fastgptPro.pay?.wx?.WX_APPID,
    show_register: !!(
      fastgptPro.auth?.email?.service || fastgptPro.auth?.phone.SNED_PHONE_TEMPLATE
    ),
    oauth: {
      github: fastgptPro.auth?.github?.clientId,
      google: fastgptPro.auth?.google?.clientId
    },
    googleClientVerKey: fastgptPro.auth?.googleV3Ver.clientKey
  };

  // format fastgptPro
  const fastgptProConfig: ConfigStoreType['fastgptPro'] = {
    system: {
      ...fastgptPro.system,
      title: formatFeConfig.systemTitle || ''
    },
    auth: {
      github: fastgptPro.auth?.github,
      google: fastgptPro.auth?.google,
      email: fastgptPro.auth?.email,
      phone: fastgptPro.auth?.phone,
      googleServiceVerKey: fastgptPro.auth.googleV3Ver.serviceKey
    },
    censor: fastgptPro.censor,
    pay: fastgptPro.pay
  };

  return {
    // @ts-ignore
    [SystemConfigsTypeEnum.fastgpt]: {
      feConfigs: formatFeConfig,
      ...formatModels
    },
    [SystemConfigsTypeEnum.fastgptPro]: fastgptProConfig
  };
}
