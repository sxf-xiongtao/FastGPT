import CustomImage from '@/pages/home/Settings/Customization/CustomImage';
import CustomJsonEditor from '@/pages/home/Settings/Customization/CustomJsonEditor';
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
      },
      scripts: {
        'ui:widget': CustomJsonEditor
      }
    },
    systemEnv: {
      chatModels: {
        'ui:emptyValue': ``
      },
      vectorMaxProcess: {
        'ui:emptyValue': 0
      },
      qaMaxProcess: {
        'ui:emptyValue': 0
      },
      pgHNSWEfSearch: {
        'ui:emptyValue': 0
      }
    },
    chatModels: {
      'ui:widget': CustomJsonEditor,
      'ui:emptyValue': ``
    },
    qaModels: {
      'ui:widget': CustomJsonEditor,
      'ui:emptyValue': ``
    },
    cqModels: {
      'ui:widget': CustomJsonEditor,
      'ui:emptyValue': ``
    },
    extractModels: {
      'ui:widget': CustomJsonEditor,
      'ui:emptyValue': ``
    },
    qgModels: {
      'ui:widget': CustomJsonEditor,
      'ui:emptyValue': ``
    },
    vectorModels: {
      'ui:widget': CustomJsonEditor,
      'ui:emptyValue': ``
    },
    reRankModels: {
      'ui:widget': CustomJsonEditor,
      'ui:emptyValue': ``
    },
    audioSpeechModels: {
      'ui:widget': CustomJsonEditor,
      'ui:emptyValue': ``
    },
    whisperModel: {
      'ui:widget': CustomJsonEditor,
      'ui:emptyValue': ``
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
