import CustomImage from '../../pages/home/Settings/Customization/CustomImage';
import CustomJSONEditor from '../../pages/home/Settings/Customization/CustomJSONEditor';

export const uiSchema = {
  fastgpt: {
    FeConfig: {
      systemTitle: {
        'ui:emptyValue': ''
      },
      api_doc_url: {
        'ui:emptyValue': ''
      },
      other_doc_url: {
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
      ChatModels: {
        'ui:widget': CustomJSONEditor,
        'ui:emptyValue': `[\n\n]`
      },
      QAModels: {
        'ui:widget': CustomJSONEditor,
        'ui:emptyValue': `[\n\n]`
      },
      CQModels: {
        'ui:widget': CustomJSONEditor,
        'ui:emptyValue': `[\n\n]`
      },
      ExtractModels: {
        'ui:widget': CustomJSONEditor,
        'ui:emptyValue': `[\n\n]`
      },
      QGModels: {
        'ui:widget': CustomJSONEditor,
        'ui:emptyValue': `[\n\n]`
      },
      VectorModels: {
        'ui:widget': CustomJSONEditor,
        'ui:emptyValue': `[\n\n]`
      },
      ReRankModels: {
        'ui:widget': CustomJSONEditor,
        'ui:emptyValue': `[\n\n]`
      },
      AudioSpeechModels: {
        'ui:widget': CustomJSONEditor,
        'ui:emptyValue': `[\n\n]`
      },
      WhisperModel: {
        'ui:widget': CustomJSONEditor,
        'ui:emptyValue': `[\n\n]`
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

export const defaultConfig = {
  fastgpt: {
    FeConfig: {
      switches: {
        show_register: true,
        show_git: false,
        show_openai_account: false,
        show_promotion: false
      },
      systemTitle: '',
      images: {
        favicon: '',
        avatar: ''
      },
      api_doc_url: '',
      other_doc_url: '',
      exportLimitMinutes: 0
    },
    models: {
      ChatModels: `[\n\n]`,
      QAModels: `[\n\n]`,
      CQModels: `[\n\n]`,
      ExtractModels: `[\n\n]`,
      QGModels: `[\n\n]`,
      VectorModels: `[\n\n]`,
      ReRankModels: `[\n\n]`,
      AudioSpeechModels: `[\n\n]`,
      WhisperModel: `[\n\n]`
    }
  },
  fastgptPro: {
    license: '',
    system: {
      userDefaultBalance: 2,
      teamDefaultMaxMember: 100
    },
    auth: {
      email: {
        service: 'qq',
        user: '',
        pass: ''
      },
      phone: {
        SNED_PHONE_ACCESSKEYID: '',
        SNED_PHONE_ACCESSSECRET: '',
        SNED_PHONE_SIGNNAME: '',
        SNED_PHONE_TEMPLATE: ''
      },
      github: {
        clientId: '',
        secret: ''
      },
      google: {
        clientId: '',
        secret: ''
      }
    },
    pay: {
      wx: {
        WX_APPID: '',
        WX_MCHID: '',
        WX_V3_CODE: '',
        WX_NOTIFY_URL: '',
        WX_SERIAL_NO: '',
        WX_PRIVATE_KEY: ''
      }
    },
    censor: {
      BAIDU_TEXT_CENSOR_CLIENTID: '',
      BAIDU_TEXT_CENSOR_CLIENTSECRET: ''
    }
  }
};
