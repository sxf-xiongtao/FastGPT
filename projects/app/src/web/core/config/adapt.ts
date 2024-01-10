import { ConfigFormType, ConfigStoreType } from '@/global/admin/config';
import CustomImage from '@/pages/home/Settings/Customization/CustomImage';
import CustomJsonEditor from '@/pages/home/Settings/Customization/CustomJsonEditor';
import CustomTextarea from '@/pages/home/Settings/Customization/CustomTextArea';
import { SystemConfigsTypeEnum } from '@fastgpt/global/common/system/config/constants';
import { RJSFSchema } from '@rjsf/utils';

export function formatConfigStore2FormSchema({
  fastgpt,
  fastgptPro
}: ConfigStoreType): ConfigFormType {
  const {
    feConfigs,
    systemEnv,
    chatModels = [],
    qaModels = [],
    cqModels = [],
    extractModels = [],
    qgModels = [],
    vectorModels = [],
    reRankModels = [],
    audioSpeechModels = [],
    whisperModel
  } = fastgpt || { feConfigs: {}, systemEnv: {} };

  const {
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
    customApiDomain = '',
    customSharePageDomain = '',
    limit = {
      exportDatasetLimitMinutes: 20,
      websiteSyncLimitMinuted: 60
    },
    scripts = []
  } = feConfigs || {};

  const {
    openapiPrefix = 'openapi',
    vectorMaxProcess = 10,
    qaMaxProcess = 10,
    pgHNSWEfSearch = 100
  } = systemEnv || {};

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
        limit,
        customApiDomain,
        customSharePageDomain,
        scripts: JSON.stringify(scripts, null, 2)
      },
      systemEnv: {
        openapiPrefix,
        vectorMaxProcess,
        qaMaxProcess,
        pgHNSWEfSearch
      },
      chatModels: JSON.stringify(chatModels, null, 2),
      qaModels: JSON.stringify(qaModels, null, 2),
      cqModels: JSON.stringify(cqModels, null, 2),
      extractModels: JSON.stringify(extractModels, null, 2),
      qgModels: JSON.stringify(qgModels, null, 2),
      vectorModels: JSON.stringify(vectorModels, null, 2),
      reRankModels: JSON.stringify(reRankModels, null, 2),
      audioSpeechModels: JSON.stringify(audioSpeechModels, null, 2),
      whisperModel: JSON.stringify(whisperModel, null, 2)
    },
    fastgptPro: {
      ...fastgptPro,
      system: {
        userDefaultBalance: fastgptPro?.system.userDefaultBalance || 3,
        teamDefaultMaxMember: fastgptPro?.system.teamDefaultMaxMember || 10
      },
      subscription: {
        datasetStorePrice: fastgptPro?.subscription?.datasetStorePrice || 0,
        datasetStoreFreeSize: fastgptPro?.subscription?.datasetStoreFreeSize || 0
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
      },
      fastLogin: JSON.stringify(fastgptPro.fastLogin || {}, null, 2)
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
      limit,
      customApiDomain,
      customSharePageDomain,
      scripts
    },
    systemEnv,
    ...models
  },
  fastgptPro
}: ConfigFormType): ConfigStoreType {
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
    customApiDomain,
    customSharePageDomain,
    // auto set field
    show_pay: !!fastgptPro.pay?.wx?.WX_APPID,
    show_register: !!(
      fastgptPro.auth?.email?.service || fastgptPro.auth?.phone.SNED_PHONE_TEMPLATE
    ),
    oauth: {
      github: fastgptPro.auth?.github?.clientId,
      google: fastgptPro.auth?.google?.clientId
    },
    googleClientVerKey: fastgptPro.auth?.googleV3Ver.clientKey,
    scripts: scripts ? JSON.parse(scripts) : [],
    subscription: {
      datasetStoreFreeSize: fastgptPro.subscription?.datasetStoreFreeSize || 0,
      datasetStorePrice: fastgptPro.subscription?.datasetStorePrice || 0
    }
  };

  // format fastgptPro
  const fastgptProConfig: ConfigStoreType['fastgptPro'] = {
    ...fastgptPro,
    system: {
      ...fastgptPro.system,
      title: formatFeConfig.systemTitle || ''
    },
    subscription: fastgptPro.subscription,
    auth: {
      github: fastgptPro.auth?.github,
      google: fastgptPro.auth?.google,
      email: fastgptPro.auth?.email,
      phone: fastgptPro.auth?.phone,
      googleServiceVerKey: fastgptPro.auth.googleV3Ver.serviceKey
    },
    censor: fastgptPro.censor,
    pay: fastgptPro.pay,
    fastLogin: (() => {
      try {
        return JSON.parse(fastgptPro.fastLogin);
      } catch (error) {
        return {};
      }
    })()
  };

  return {
    // @ts-ignore
    [SystemConfigsTypeEnum.fastgpt]: {
      feConfigs: formatFeConfig,
      systemEnv,
      ...formatModels
    },
    [SystemConfigsTypeEnum.fastgptPro]: fastgptProConfig
  };
}

export function formConfig2uiSchema(formConfig: RJSFSchema) {
  let uiSchema: any = {};

  for (let key in formConfig.properties) {
    if (formConfig.properties[key].type === 'object' || !formConfig.properties[key].type) {
      uiSchema[key] = formConfig2uiSchema(formConfig.properties[key]);
    } else {
      let defaultValue = formConfig.properties[key].defaultValue;
      switch (formConfig.properties[key].type) {
        case 'number':
          uiSchema[key] = { 'ui:emptyValue': defaultValue !== undefined ? defaultValue : 0 };
          break;
        case 'image':
          uiSchema[key] = {
            'ui:emptyValue': defaultValue !== undefined ? defaultValue : '',
            'ui:widget': CustomImage
          };
          break;
        case 'textarea':
          uiSchema[key] = {
            'ui:emptyValue': defaultValue !== undefined ? defaultValue : '',
            'ui:widget': CustomTextarea
          };
          break;
        case 'json':
          uiSchema[key] = {
            'ui:emptyValue': defaultValue !== undefined ? defaultValue : '',
            'ui:widget': CustomJsonEditor
          };
          break;
        default:
          uiSchema[key] = { 'ui:emptyValue': defaultValue !== undefined ? defaultValue : '' };
      }
    }
  }

  return uiSchema;
}

export function formatFormConfig(formConfig: RJSFSchema) {
  let formattedConfig = { ...formConfig };

  for (let key in formattedConfig.properties) {
    if (
      formattedConfig.properties[key].type === 'object' ||
      !formattedConfig.properties[key].type
    ) {
      formattedConfig.properties[key] = formatFormConfig(formattedConfig.properties[key]);
    } else {
      if (['image', 'json', 'textarea'].includes(formattedConfig.properties[key].type)) {
        formattedConfig.properties[key].type = 'string';
      }
    }
  }

  return formattedConfig;
}
