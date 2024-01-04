import CustomImage from '../../pages/home/Settings/Customization/CustomImage';
import CustomJSONEditor from '../../pages/home/Settings/Customization/CustomJSONEditor';
import CustomTextarea from '@/pages/home/Settings/Customization/CustomTextArea';

export const uiSchema = {
  fastgpt: {
    feConfigs: {
      systemTitle: {
        'ui:emptyValue': ''
      },
      openAPIDocUrl: {
        'ui:emptyValue': ''
      },
      docUrl: {
        'ui:emptyValue': ''
      },
      chatbotUrl: {
        'ui:emptyValue': ''
      },
      concatMd: {
        'ui:emptyValue': '',
        'ui:widget': CustomTextarea
      },
      images: {
        favicon: {
          'ui:widget': CustomImage
        }
      },
      limit: {
        exportDatasetLimitMinutes: {
          'ui:emptyValue': 0
        },
        websiteSyncLimitMinuted: {
          'ui:emptyValue': 0
        }
      }
    },
    models: {
      chatModels: {
        'ui:widget': CustomJSONEditor,
        'ui:emptyValue': ``
      },
      qaModels: {
        'ui:widget': CustomJSONEditor,
        'ui:emptyValue': ``
      },
      cqModels: {
        'ui:widget': CustomJSONEditor,
        'ui:emptyValue': ``
      },
      extractModels: {
        'ui:widget': CustomJSONEditor,
        'ui:emptyValue': ``
      },
      qgModels: {
        'ui:widget': CustomJSONEditor,
        'ui:emptyValue': ``
      },
      vectorModels: {
        'ui:widget': CustomJSONEditor,
        'ui:emptyValue': ``
      },
      reRankModels: {
        'ui:widget': CustomJSONEditor,
        'ui:emptyValue': ``
      },
      audioSpeechModels: {
        'ui:widget': CustomJSONEditor,
        'ui:emptyValue': ``
      },
      whisperModel: {
        'ui:widget': CustomJSONEditor,
        'ui:emptyValue': ``
      }
    }
  },
  fastgptPro: {
    system: {
      fastgpt_domain: {
        'ui:emptyValue': ''
      },
      userDefaultBalance: {
        'ui:emptyValue': 0
      },
      teamDefaultMaxMember: {
        'ui:emptyValue': 1
      },
      datasetStorePrice: {
        'ui:emptyValue': 1
      }
    },
    auth: {
      googleV3Ver: {
        clientKey: {
          'ui:emptyValue': ''
        },
        serviceKey: {
          'ui:emptyValue': ''
        }
      },
      email: {
        service: {
          'ui:emptyValue': ''
        },
        user: {
          'ui:emptyValue': ''
        },
        pass: {
          'ui:emptyValue': ''
        }
      },
      phone: {
        SNED_PHONE_ACCESSKEYID: {
          'ui:emptyValue': ''
        },
        SNED_PHONE_ACCESSSECRET: {
          'ui:emptyValue': ''
        },
        SNED_PHONE_SIGNNAME: {
          'ui:emptyValue': ''
        },
        SNED_PHONE_TEMPLATE: {
          'ui:emptyValue': ''
        }
      },
      github: {
        clientId: {
          'ui:emptyValue': ''
        },
        secret: {
          'ui:emptyValue': ''
        }
      },
      google: {
        clientId: {
          'ui:emptyValue': ''
        },
        secret: {
          'ui:emptyValue': ''
        }
      }
    },
    pay: {
      wx: {
        WX_APPID: {
          'ui:emptyValue': ''
        },
        WX_MCHID: {
          'ui:emptyValue': ''
        },
        WX_V3_CODE: {
          'ui:emptyValue': ''
        },
        WX_NOTIFY_URL: {
          'ui:emptyValue': ''
        },
        WX_SERIAL_NO: {
          'ui:emptyValue': ''
        },
        WX_PRIVATE_KEY: {
          'ui:widget': CustomTextarea,
          'ui:emptyValue': ''
        }
      }
    },
    censor: {
      BAIDU_TEXT_CENSOR_CLIENTID: {
        'ui:emptyValue': ''
      },
      BAIDU_TEXT_CENSOR_CLIENTSECRET: {
        'ui:emptyValue': ''
      }
    }
  }
};
