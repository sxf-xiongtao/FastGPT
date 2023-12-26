import CustomImage from '../../pages/home/Settings/Customization/CustomImage';
import CustomJSONEditor from '../../pages/home/Settings/Customization/CustomJSONEditor';

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
      images: {
        favicon: {
          'ui:widget': CustomImage
        },
        avatar: {
          'ui:widget': CustomImage
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
    license: {
      'ui:emptyValue': ''
    },
    auth: {
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
