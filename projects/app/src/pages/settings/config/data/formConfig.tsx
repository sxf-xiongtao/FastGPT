import { FieldTypeEnum } from '@/web/admin/config/constants';

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

export const getFormConfig = (): FormConfig => {
  return {
    siteSettings: {
      key: 'siteSettings',
      title: '基础配置',
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
            show_promotion: {
              key: 'siteSettings.feConfigs.show_promotion',
              type: 'boolean',
              title: '展示邀请好友活动'
            },
            show_compliance_documentation: {
              key: 'siteSettings.feConfigs.show_compliance_copywriting',
              type: 'boolean',
              title: '前端是否展示合规提示文案'
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
              description:
                '可以设置一个额外的api地址，不使用主站的地址，需配置域名的cname和ssl证书。'
            },
            customSharePageDomain: {
              key: 'siteSettings.feConfigs.customSharePageDomain',
              type: 'string',
              title: '自定义分享链接域名',
              description:
                '可以设置一个额外的分享链接地址，不使用主站的地址，需配置域名的cname和ssl证书。'
            },
            favicon: { key: 'siteSettings.feConfigs.favicon', type: 'image', title: 'favicon' },
            openapiPrefix: {
              key: 'siteSettings.systemEnv.openapiPrefix',
              type: 'string',
              title: 'OpenAPI 前缀'
            }
          }
        },

        personalized: {
          key: 'personalized.systemEnv',
          type: 'object',
          title: ' 个性化配置',

          properties: {
            concatMd: {
              key: 'siteSettings.concatMd',
              type: 'textarea',
              title: '联系弹窗',
              description:
                '使用 Markdown 进行配置，配置之后，在网页中“联系我们”相关的内容，会提示填写的内容。'
            },
            openAPIDocUrl: {
              key: 'siteSettings.feConfigs.openAPIDocUrl',
              type: 'string',
              title: '自定义 api 文档地址',
              description: '自定义 openapi 文档地址'
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
            }
          }
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
            oneapiUrl: {
              key: 'siteSettings.systemEnv.oneapiUrl',
              type: 'string',
              title: '模型调用根地址(会覆盖环境变量配置的)',
              description: 'https://aiproxy.fastgpt.cn/v1'
            },
            chatApiKey: {
              key: 'siteSettings.systemEnv.chatApiKey',
              type: 'string',
              title: '模型调用密钥(会覆盖环境变量配置的)',
              description: 'sk-xxxxx'
            },
            vectorMaxProcess: {
              key: 'siteSettings.systemEnv.vectorMaxProcess',
              type: 'number',
              title: '知识库索引最大处理进程'
            },
            qaMaxProcess: {
              key: 'siteSettings.systemEnv.qaMaxProcess',
              type: 'number',
              title: '文件理解模型最大处理进程'
            },
            vlmMaxProcess: {
              key: 'siteSettings.systemEnv.vlmMaxProcess',
              type: 'number',
              title: '图片理解模型最大处理进程'
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
        pdfParse: {
          key: 'siteSettings.systemEnv',
          type: 'object',
          title: 'PDF 解析配置',
          properties: {
            customPdfParseUrl: {
              key: 'siteSettings.systemEnv.customPdfParse.url',
              type: 'string',
              title: '自定义 PDF 解析地址'
            },
            customPdfParseKey: {
              key: 'siteSettings.systemEnv.customPdfParse.key',
              type: 'string',
              title: '自定义 PDF 解析密钥'
            },
            customPdfParseDoc2xKey: {
              key: 'siteSettings.systemEnv.customPdfParse.doc2xKey',
              type: 'string',
              title: 'Doc2x pdf 解析密钥（比自定义 PDF 解析优先级低）'
            },
            customPdfParsePrice: {
              key: 'siteSettings.systemEnv.customPdfParse.price',
              type: 'number',
              title: '自定义 PDF 解析价格(n 积分/页)'
            }
          }
        },
        limit: {
          key: 'siteSettings.limit',
          type: 'object',
          title: '使用限制',
          properties: {
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
        },
        navbar: {
          key: 'siteSettings.navbar',
          type: FieldTypeEnum.NavbarItems,
          title: '侧边栏配置',
          description: '移动端的侧边栏显示在账号 - 个人信息里'
        }
      }
    }
  };
};

export default function Dom() {
  return <></>;
}

export const ModelFormConfig: FormConfig = {
  censor: {
    key: 'securitySettings.censor',
    type: 'object',
    title: '内容安全审查',
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
      },
      customCensorURL: {
        key: 'securitySettings.censor.customCensorURL',
        type: 'string',
        title: '自定义安全校验 URL',
        description: '如果您有自己的安全校验服务，可以填写该地址，并在安全设置中开启自定义安全校验'
      }
    }
  }
};

export const PayFormConfig: FormConfig = {
  subPlans: {
    key: 'paySettings.subPlans',
    type: 'object',
    title: '订阅套餐',
    properties: {
      standard: {
        key: 'paySettings.subPlans.standard',
        title: '标准订阅套餐',
        type: FieldTypeEnum.StandardPlans,
        description: ''
      },
      planDescriptionUrl: {
        key: 'paySettings.subPlans.planDescriptionUrl',
        type: 'string',
        title: '自定义套餐说明',
        description:
          '如果填写了该地址，会覆盖系统上套餐页面，会跳转到这个自定义页面，你可以在自定义页面里定义收费规则。'
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
  },
  paySettings: {
    key: 'paySettings',
    title: '支付方式',
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
      }
    }
  }
};

export const ThirdPartyFormConfig: FormConfig = {
  externalProviderSettings: {
    key: 'externalProviderSettings',
    type: 'object',
    title: '第三方账号配置',
    properties: {
      userAccount: {
        key: 'externalProviderSettings.userAccount',
        type: 'boolean',
        title: '允许用户配置账号',
        properties: {
          openAI: {
            key: 'siteSettings.feConfigs.show_openai_account',
            type: 'boolean',
            title: 'OpenAI/OneAPI 账号'
          },
          laf: {
            key: 'siteSettings.feConfigs.lafEnv',
            type: FieldTypeEnum.thirdPartyAccountItem,
            title: 'laf 账号',
            description: '请输入 laf 地址'
          }
        }
      },
      externalProviderWorkflowVariables: {
        key: 'externalProviderSettings.externalProviderWorkflowVariables',
        type: FieldTypeEnum.thirdPartyVariables,
        title: '自定义工作流变量'
      }
    }
  }
};

export const getUserFormConfig = (): FormConfig => {
  return {
    loginSettings: {
      key: 'loginSettings',
      title: '通知 & 登录配置',
      type: 'object',
      properties: {
        singleTeamMode: {
          key: 'loginSettings.singleTeamMode',
          type: 'boolean',
          title: '单团队模式',
          description: `开启后，不再创建默认团队，而是加入 Root 用户团队。优先级：成员同步模式（目前仅支持企微）> 单团队模式 > 多团队模式 ![](/imgs/single-team-mode-intro.png)`
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
            },
            register: {
              key: 'loginSettings.email.register',
              type: 'boolean',
              title: '开启邮箱注册',
              description: '是否开启邮箱注册'
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
              title: '注册账号',
              description: '填写后，将会开启手机号注册'
            },
            RESET_PASSWORD: {
              key: 'loginSettings.sms.RESET_PASSWORD',
              type: 'string',
              title: '重置密码',
              description: '填写后，将会开启手机号找回密码'
            },
            BIND_NOTIFICATION: {
              key: 'loginSettings.sms.BIND_NOTIFICATION',
              type: 'string',
              title: '绑定通知手机号',
              description: '填写后，将会允许手机号绑定通知方式'
            },
            EXPIRE_SOON: {
              key: 'loginSettings.sms.EXPIRE_SOON',
              type: 'string',
              title: '订阅套餐即将过期',
              description: '填写后，套餐即将过期，会发送一个短信'
            },
            FREE_CLEAN: {
              key: 'loginSettings.sms.FREE_CLEAN',
              type: 'string',
              title: '免费版用户清理警告'
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
        dingtalk: {
          key: 'loginSettings.dingtalk',
          type: 'object',
          title: '钉钉登录配置',
          properties: {
            clientId: {
              key: 'loginSettings.dingtalk.clientId',
              type: 'string',
              title: 'Client ID',
              description: '钉钉应用的 Client ID'
            },
            secret: {
              key: 'loginSettings.dingtalk.secret',
              type: 'string',
              title: 'Client Secret',
              description: '钉钉应用的 Client Secret'
            }
          }
        },
        wecom: {
          type: 'object',
          key: 'loginSettings.wecom',
          title: '企业微信配置',
          properties: {
            corpid: {
              key: 'loginSettings.wecom.corpid',
              type: 'string',
              title: '企业微信应用 CorpID',
              description: '对应企业微信企业的「CorpID」'
            },
            agentid: {
              key: 'loginSettings.wecom.agentid',
              type: 'string',
              title: '企业微信应用 AgentId',
              description: '对应企业微信应用的「AgentId」'
            },
            secret: {
              key: 'loginSettings.wecom.secret',
              type: 'string',
              title: '企业微信应用 Secret',
              description: '对应企业微信应用的「Secret」'
            },
            syncSecret: {
              key: 'loginSettings.wecom.syncSecret',
              type: 'string',
              title: '企业微信通讯录同步助手的Secret',
              description: '用于访问企业微信通讯录'
            },
            isSync: {
              key: 'loginSettings.wecom.isSync',
              type: 'boolean',
              title: '是否开启从企业微信同步用户',
              description:
                '开启后，将无法使用注册功能。将每 24 小时从企业微信同步一次用户信息，也可以在前端手动进行同步。'
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
        microsoft: {
          type: 'object',
          title: '微软登录配置',
          key: 'loginSettings.microsoft',
          properties: {
            clientId: {
              key: 'loginSettings.microsoft.clientId',
              type: 'string',
              title: 'Microsoft Client ID',
              description: '对应 Microsoft 应用的「应用程序(客户端) ID」'
            },
            secret: {
              key: 'loginSettings.microsoft.secret',
              type: 'string',
              title: 'Microsoft Client Secret'
            },
            tenantId: {
              key: 'loginSettings.microsoft.tenantId',
              type: 'string',
              title: 'Microsoft Tenant ID',
              description: '对应 Microsoft 应用的「租户 ID」, 若使用默认的 common 可不用填写'
            },
            customButton: {
              key: 'loginSettings.microsoft.customButton',
              type: 'string',
              title: '自定义按钮名',
              description: '自定义按钮的名称，若不填写则使用默认的 Microsoft 按钮'
            }
          }
        },

        sso: {
          key: 'siteSettings.sso',
          type: 'object',
          title: '自定义 SSO 配置',
          properties: {
            url: {
              key: 'siteSettings.sso.url',
              type: 'string',
              title: 'SSO 服务根地址(末尾不加/)',
              description: `具体用法请看： [FastGPT SSO 配置](https://fael3z0zfze.feishu.cn/docx/FugkdIgOJoCnrcxUcTycWZwInde)`
            },
            title: {
              key: 'siteSettings.sso.title',
              title: 'SSO 登录按钮标题',
              type: 'string',
              description: '配置 SSO 登录按钮的标题'
            },
            icon: {
              key: 'siteSettings.sso.icon',
              title: 'SSO 登录按钮的图标',
              type: 'image'
            },
            autoLogin: {
              key: 'siteSettings.sso.autoLogin',
              title: 'SSO 自动跳转',
              type: 'boolean',
              description: '开启后，用户进入登录页面，将会自动触发 SSO 登录，无需手动点击。'
            }
          }
        },
        fastLogin: {
          key: 'fastlogin',
          type: 'object',
          title: '快速登录(不推荐)',
          properties: {
            fastlogin: {
              key: 'loginSettings.fastLogin',
              title: '',
              type: 'json'
            }
          }
        }
      }
    }
  };
};
