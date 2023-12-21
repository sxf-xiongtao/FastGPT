import CustomImage from '../../pages/home/Settings/Customization/CustomImage';
import CustomJSONEditor from '../../pages/home/Settings/Customization/CustomJSONEditor';

export const uiSchema = {
  fastgpt: {
    FeConfig: {
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
        'ui:widget': CustomJSONEditor
      },
      QAModels: {
        'ui:widget': CustomJSONEditor
      },
      CQModels: {
        'ui:widget': CustomJSONEditor
      },
      ExtractModels: {
        'ui:widget': CustomJSONEditor
      },
      QGModels: {
        'ui:widget': CustomJSONEditor
      },
      VectorModels: {
        'ui:widget': CustomJSONEditor
      },
      ReRankModels: {
        'ui:widget': CustomJSONEditor
      },
      AudioSpeechModels: {
        'ui:widget': CustomJSONEditor
      },
      WhisperModel: {
        'ui:widget': CustomJSONEditor
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
      exportLimitMinutes: 10
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
      userDefaultBalance: 0,
      teamDefaultMaxMember: 0
    },
    auth: {
      email: {
        service: '',
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
