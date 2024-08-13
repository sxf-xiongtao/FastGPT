type FormConfig = {
  [key: string]: {
    key: string;
    title: string;
    type: string;
    properties: {
      [key: string]: {
        key: string;
        type: string;
        title: string;
        description?: string;
        properties?: {
          [key: string]: {
            key: string;
            type: string;
            title: string;
            default?: string;
            description?: string;
          };
        };
      };
    };
  };
};

export const formConfig: FormConfig = {
  siteSettings: {
    key: 'siteSettings',
    title: '站点设置',
    type: 'object',
    properties: {
      feConfigs: {
        key: 'siteSettings.feConfigs',
        type: 'object',
        title: '前端展示配置',
        properties: {
          show_team_chat: {
            key: 'siteSettings.feConfigs.show_team_chat',
            type: 'boolean',
            title: '展示团队分享'
            // description:
            //   '详细使用，请参考：[团队标签方案](https://fael3z0zfze.feishu.cn/wiki/FopHwjMraib3L6k4hL5cryIfnWc) 。可以创建一个多个应用的分享窗口，通过已有系统的用户标签进行鉴权。'
          },
          show_emptyChat: {
            key: 'siteSettings.feConfigs.show_emptyChat',
            type: 'boolean',
            title: '展示聊天空白页（都关闭即可）'
          },
          show_git: {
            key: 'siteSettings.feConfigs.show_git',
            type: 'boolean',
            title: '展示 github 图标'
          },
          show_openai_account: {
            key: 'siteSettings.feConfigs.show_openai_account',
            type: 'boolean',
            title: '展示用户可填自己的 openapi 账号'
          },
          show_promotion: {
            key: 'siteSettings.feConfigs.show_promotion',
            type: 'boolean',
            title: '展示邀请好友活动'
          },
          systemTitle: {
            key: 'siteSettings.feConfigs.systemTitle',
            type: 'string',
            title: '系统名'
          },
          customApiDomain: {
            key: 'siteSettings.feConfigs.customApiDomain',
            type: 'string',
            title: '自定义api域名',
            description: '可以设置一个额外的api地址，不使用主站的地址，需配置域名的cname和ssl证书。'
          },
          customSharePageDomain: {
            key: 'siteSettings.feConfigs.customSharePageDomain',
            type: 'string',
            title: '自定义分享链接域名',
            description:
              '可以设置一个额外的分享链接地址，不使用主站的地址，需配置域名的cname和ssl证书。'
          },
          favicon: { key: 'siteSettings.feConfigs.favicon', type: 'image', title: 'favicon' },
          openAPIDocUrl: {
            key: 'siteSettings.feConfigs.openAPIDocUrl',
            type: 'string',
            title: 'api 文档地址',
            description: 'openapi的文档地址'
          },
          docUrl: {
            key: 'siteSettings.feConfigs.docUrl',
            type: 'string',
            title: '文档地址（加一个 / 结尾，否则会携带子路径跳转）'
          },
          systemPluginCourseUrl: {
            key: 'siteSettings.feConfigs.systemPluginCourseUrl',
            type: 'string',
            title: '贡献插件文档地址'
          },
          commitAppTemplateCourseUrl: {
            key: 'siteSettings.feConfigs.appTemplateCourse',
            type: 'string',
            title: '贡献模板市场文档地址'
          },
          chatbotUrl: {
            key: 'siteSettings.feConfigs.chatbotUrl',
            type: 'string',
            title: '聊天机器人地址'
          },
          uploadFileMaxAmount: {
            key: 'siteSettings.feConfigs.uploadFileMaxAmount',
            type: 'number',
            title: '单次最多上传多少个文件',
            description: '用户上传知识库时，每次上传最多选择多少个文件'
          },
          uploadFileMaxSize: {
            key: 'siteSettings.feConfigs.uploadFileMaxSize',
            type: 'number',
            title: '上传文件最大大小（M)',
            description:
              '用户上传知识库时，每个文件最大是多少。放大的话，需要注意网关也要设置得够大。'
          },
          lafEnv: {
            key: 'siteSettings.feConfigs.lafEnv',
            type: 'string',
            title: 'laf 环境的地址',
            description: 'laf 环境，例如 https://laf.dev'
          }
        }
      },

      concatMd: {
        key: 'siteSettings.concatMd',
        type: 'textarea',
        title: '联系弹窗',
        description:
          '使用 Markdown 进行配置，配置之后，在网页中“联系我们”相关的内容，会提示填写的内容。'
      },

      scripts: {
        key: 'siteSettings.scripts',
        type: 'json',
        title: '全局 Script 脚本',
        description: '自定义 Script 脚本，可以全局插入（可以做站点流量监控之类的）'
      },

      systemEnv: {
        key: 'siteSettings.systemEnv',
        type: 'object',
        title: '系统参数',
        properties: {
          openapiPrefix: {
            key: 'siteSettings.systemEnv.openapiPrefix',
            type: 'string',
            title: 'OpenAPI 前缀'
          },
          oneapiUrl: {
            key: 'siteSettings.systemEnv.oneapiUrl',
            type: 'string',
            title: 'oneAPI地址',
            description: 'oneAPI地址，可以使用 oneapi 来实现多模型接入'
          },
          chatApiKey: {
            key: 'siteSettings.systemEnv.chatApiKey',
            type: 'string',
            title: '通用Key',
            description:
              '可以是 openai 的，也可以是 oneapi 的\n此处逻辑：优先走 ONEAPI_URL，如果填写了 ONEAPI_URL，key 也需要是 ONEAPI 的 key'
          },
          vectorMaxProcess: {
            key: 'siteSettings.systemEnv.vectorMaxProcess',
            type: 'number',
            title: '向量训练最大进程'
          },
          qaMaxProcess: {
            key: 'siteSettings.systemEnv.qaMaxProcess',
            type: 'number',
            title: 'QA训练最大进程'
          },
          pgHNSWEfSearch: {
            key: 'siteSettings.systemEnv.pgHNSWEfSearch',
            type: 'number',
            title: 'HNSW ef_search',
            description: '没有特殊设置过索引的，默认 100 即可'
          },
          tokenWorkers: {
            key: 'siteSettings.systemEnv.tokenWorkers',
            type: 'number',
            title: 'token计算最大进程（通常多少并发设置多少）'
          }
        }
      },

      limit: {
        key: 'siteSettings.limit',
        type: 'object',
        title: '使用限制',
        properties: {
          exportDatasetLimitMinutes: {
            key: 'siteSettings.limit.exportDatasetLimitMinutes',
            type: 'number',
            title: '导出间隔时长(分钟)'
          },
          websiteSyncLimitMinuted: {
            key: 'siteSettings.limit.websiteSyncLimitMinuted',
            type: 'number',
            title: '站点同步使用间隔时长(分钟)'
          }
        }
      }
    }
  },
  modelSettings: {
    key: 'modelSettings',
    title: '模型设置',
    type: 'object',
    properties: {
      llmModels: {
        key: 'modelSettings.llmModels',
        title: 'LLM大语言模型',
        description: '用于对话、分类、内容提取等',
        type: 'json'
      },
      vectorModels: {
        key: 'modelSettings.vectorModels',
        title: '向量模型',
        description: '用于知识库的索引',
        type: 'json'
      },
      reRankModels: { key: 'modelSettings.reRankModels', title: '重排模型', type: 'json' },
      audioSpeechModels: {
        key: 'modelSettings.audioSpeechModels',
        title: '语音播放模型',
        type: 'json'
      },
      whisperModel: { key: 'modelSettings.whisperModel', title: '语音输入模型', type: 'json' }
    }
  },
  loginSettings: {
    key: 'loginSettings',
    title: '通知 & 登录配置',
    type: 'object',
    properties: {
      google: {
        type: 'object',
        title: '谷歌登录配置',
        key: 'loginSettings.google',
        properties: {
          clientId: {
            key: 'loginSettings.google.clientId',
            type: 'string',
            title: 'Google Client ID'
          },
          secret: {
            key: 'loginSettings.google.secret',
            type: 'string',
            title: 'Google Secret'
          }
        }
      },
      email: {
        key: 'loginSettings.email',
        type: 'object',
        title: '邮箱通知配置(注册、套餐通知)',
        properties: {
          smtp: {
            key: 'loginSettings.email.smtp',
            type: 'string',
            title: '邮箱服务SMTP地址',
            description: '不同厂商不一样\nQQ: smtp.qq.com\ngmail: smtp.gmail.com'
          },
          user: {
            key: 'loginSettings.email.user',
            type: 'string',
            title: '邮箱 User',
            description: 'qq 邮箱为例，对应 qq 号'
          },
          pass: {
            key: 'loginSettings.email.pass',
            type: 'string',
            title: '邮箱 Password',
            description: '对应 SMTP 授权码'
          }
        }
      },
      phone: {
        key: 'loginSettings.phone',
        type: 'object',
        title: '阿里云短信配置',
        properties: {
          SNED_PHONE_ACCESSKEYID: {
            key: 'loginSettings.phone.SNED_PHONE_ACCESSKEYID',
            type: 'string',
            title: 'ACCESSKEYID',
            description:
              '阿里云短信参数\nhttps://dysms.console.aliyun.com/overview\n申请对应的签名和短信模板，提供：\nACCESSKEYID\nACCESSSECRET\n签名名称\n模板CODE，SM开头的'
          },
          SNED_PHONE_ACCESSSECRET: {
            key: 'loginSettings.phone.SNED_PHONE_ACCESSSECRET',
            type: 'string',
            title: 'ACCESSSECRET',
            description: '阿里云账号的secret key'
          },
          SNED_PHONE_SIGNNAME: {
            key: 'loginSettings.phone.SNED_PHONE_SIGNNAME',
            type: 'string',
            title: '签名名称',
            description: '短信签名'
          }
        }
      },
      sms: {
        key: 'loginSettings.sms',
        type: 'object',
        title: '阿里云短信模板CODE（SMS_xxx）',
        properties: {
          REGISTER: {
            key: 'loginSettings.sms.REGISTER',
            type: 'string',
            title: '注册账号'
          },
          RESET_PASSWORD: {
            key: 'loginSettings.sms.RESET_PASSWORD',
            type: 'string',
            title: '重置密码'
          },
          BIND_NOTIFICATION: {
            key: 'loginSettings.sms.BIND_NOTIFICATION',
            type: 'string',
            title: '绑定通知手机号'
          },
          EXPIRE_SOON: {
            key: 'loginSettings.sms.EXPIRE_SOON',
            type: 'string',
            title: '订阅套餐即将过期'
          },
          FREE_CLEAN: {
            key: 'loginSettings.sms.FREE_CLEAN',
            type: 'string',
            title: '免费版用户清理警告'
          }
        }
      },
      github: {
        key: 'loginSettings.github',
        type: 'object',
        title: 'GitHub 登录配置',
        properties: {
          clientId: {
            key: 'loginSettings.github.clientId',
            type: 'string',
            title: 'GitHub Client ID',
            description:
              'https://github.com/settings/developers，注册一个 oauth，\nHomepage: 域名\nCallbackurl: 域名/login/provider\n提供：\nclientId: \nclientSecret:'
          },
          secret: {
            key: 'loginSettings.github.secret',
            type: 'string',
            title: 'GitHub Secret'
          }
        }
      },
      wechat: {
        key: 'loginSettings.wechat',
        type: 'object',
        title: '微信服务号登录',
        properties: {
          appID: {
            key: 'loginSettings.wechat.appID',
            type: 'string',
            title: 'AppID',
            description:
              '服务号的 Appid。微信服务号的验证地址填写：商业版域名//api/support/user/account/login/wx/callback'
          },
          appSecret: {
            key: 'loginSettings.wechat.appSecret',
            type: 'string',
            title: 'AppSecret',
            description: '服务号的 Secret'
          }
        }
      },
      fastLogin: {
        key: 'fastlogin',
        type: 'object',
        title: '快速登录(可选)',
        properties: {
          fastlogin: {
            key: 'loginSettings.fastLogin',
            title: '',
            type: 'json'
          }
        }
      }
    }
  },
  paySettings: {
    key: 'paySettings',
    title: '支付 & 订阅套餐',
    type: 'object',
    properties: {
      wx: {
        key: 'paySettings.wx',
        type: 'object',
        title: '微信支付配置',
        properties: {
          WX_APPID: {
            key: 'paySettings.wx.WX_APPID',
            type: 'string',
            title: 'appid',
            description:
              '微信支付相关材料\nhttps://pay.weixin.qq.com/index.php/core/home/login?return_url=https%3A%2F%2Fpay.weixin.qq.com%2Findex.php%2Fextend%2Femployee\n自行注册微信支付，目前需要wx扫码支付\nappid: ![](https://oss.laf.dev/lk63dw-fastgpt/appid.png)'
          },
          WX_MCHID: {
            key: 'paySettings.wx.WX_MCHID',
            type: 'string',
            title: 'Merchant ID',
            description: '![](https://oss.laf.dev/lk63dw-fastgpt/wx_mchid.png)'
          },
          WX_V3_CODE: {
            key: 'paySettings.wx.WX_V3_CODE',
            type: 'string',
            title: 'V3 Code',
            description: '![](https://oss.laf.dev/lk63dw-fastgpt/ws_v3_code.png)'
          },
          WX_NOTIFY_URL: {
            key: 'paySettings.wx.WX_NOTIFY_URL',
            type: 'string',
            title: 'Notify URL',
            description: '没用到，随便填个'
          },
          WX_SERIAL_NO: {
            key: 'paySettings.wx.WX_SERIAL_NO',
            type: 'string',
            title: 'Serial Number',
            description:
              '点管理证书进去看到\n![](https://oss.laf.dev/lk63dw-fastgpt/wx_serial_no.png)'
          },
          WX_PRIVATE_KEY: {
            key: 'paySettings.wx.WX_PRIVATE_KEY',
            type: 'textarea',
            title: 'Private Key',
            description:
              '按微信教程拿到这几个文件，txt打开key\n![](https://oss.laf.dev/lk63dw-fastgpt/wx_private_key.png)'
          }
        }
      },
      subPlans: {
        key: 'paySettings.subPlans',
        type: 'object',
        title: '订阅套餐',
        properties: {
          standard: {
            key: 'paySettings.subPlans.standard',
            title: '标准订阅套餐（需严格按模板填写，可修改里面的子项）',
            type: 'json',
            description: '如果需要提供Saas服务，可以私聊我们拿配置。',
            default: ''
          },
          extraDatasetSizePrice: {
            key: 'paySettings.subPlans.extraDatasetSizePrice',
            type: 'number',
            title: '知识库存储费用（xx元/1000条/月）'
          },
          extraPointsPrice: {
            key: 'paySettings.subPlans.extraPointsPrice',
            type: 'number',
            title: '额外AI积分费用（xx元/1000积分/月）'
          }
        }
      }
    }
  },
  securitySettings: {
    key: 'securitySettings',
    title: '安全设置',
    type: 'object',
    properties: {
      censor: {
        key: 'securitySettings.censor',
        type: 'object',
        title: '内容审查',
        properties: {
          BAIDU_TEXT_CENSOR_CLIENTID: {
            key: 'securitySettings.censor.BAIDU_TEXT_CENSOR_CLIENTID',
            type: 'string',
            title: '百度安全 id',
            description:
              '![](https://oss.laf.dev/lk63dw-fastgpt/baidu_censor.png)\nhttps://console.bce.baidu.com/ai/?_=1693133074333#/ai/antiporn/overview/index 注册百度安全校验账号，并创建对应应用。提供应用的 id 和 secret'
          },
          BAIDU_TEXT_CENSOR_CLIENTSECRET: {
            key: 'securitySettings.censor.BAIDU_TEXT_CENSOR_CLIENTSECRET',
            type: 'string',
            title: '百度安全 secret'
          }
        }
      },
      googleV3Ver: {
        key: 'securitySettings.googleV3Ver',
        type: 'object',
        title: '谷歌V3安全校验',
        properties: {
          clientKey: {
            key: 'securitySettings.googleV3Ver.clientKey',
            type: 'string',
            title: '客户端Key',
            description:
              '![](https://oss.laf.dev/lk63dw-fastgpt/google_service_ver_key_1.png)\n![](https://oss.laf.dev/lk63dw-fastgpt/google_service_ver_key_2.png)\nhttps://www.google.com/recaptcha/about/\nclientId: \nserviceId:\n每月有免费额度，基本够用'
          },
          serviceKey: {
            key: 'securitySettings.googleV3Ver.serviceKey',
            type: 'string',
            title: '服务端Key'
          }
        }
      }
    }
  }
};

export default function Dom() {
  return <></>;
}
