import CustomImage from '../../pages/home/Settings/Customization/CustomImage';

export const uiSchema = {
  'ui:widget': CustomImage,
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
