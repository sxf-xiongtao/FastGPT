declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // # 二级路由
      NEXT_PUBLIC_BASE_URL: string;
      // # DB_MAX_LINK=5
      // # root key, 最高权限
      ROOT_KEY: string;
      // # OneAPI 的地址
      OPENAI_BASE_URL: string;
      CHAT_API_KEY: string;
      // # 沙盒内网地址
      SANDBOX_URL: string;
      // # Plugin URL 插件地址
      PLUGIN_URL: string;
      // # mongodb
      MONGODB_URI: string;
      // # pg
      PG_URL: string;
      // # milvus
      MILVUS_ADDRESS: string;
      MILVUS_TOKEN: string;
      // # FastGPT 前端地址, 文件前缀，从 admin 打开前台。
      FE_DOMAIN: string;
      // # 是否开启 FastGPT 前端的 WebSocket 支持
      ENABLE_WEBSOCKET: string;
      // # 账单更新频率
      UPDATE_BALANCE_DELAY: string;
      // # 开票通知（飞书 webhook 和对应按键的回调地址）
      INVOICE_FEISHU_WEBHOOK_URL: string;
      INVOICE_FEISHU_WEBHOOK_CALLBACK_URL: string;
      // # 日志等级: debug, info, warn, error
      LOG_LEVEL: string;
      STORE_LOG_LEVEL: string;
      // # 发送 SMS 的代理地址
      SMS_PROXY: string;
      // # 网络爬虫最大页面数
      MAX_CRAWL_PAGE: string;
      // # 是否启用动态页面爬虫, 默认关闭
      CRAWL_DYNAMIC_WEBSITE: string;
      // # 爬虫过滤域名 (使用半角逗号分割多个域名)
      CRAWL_EXCLUDE_LIST: string;
      // # 百度转化跟踪
      BAIDU_CONVERSION_TOKEN: string;
      BAIDU_CONVERSION_BASE_URL: string;
      // # 是否展示 Git 信息，不填写的话就不展示
      SHOW_GIT: string;
      // # 清理免费用户
      WARN_FREE_ACCOUNT: string;
      CLEAR_FREE_ACCOUNT: string;
      // # 飞书私有化地址
      FEISHU_BASE_URL: string;
      // # 语雀知识库默认根地址
      YUQUE_DATASET_BASE_URL: string;
      // # 成员自动同步
      SYNC_MEMBER_CRON: string;
      // # Workorder 工单相关
      WORKORDER_BASE_URL: string;
      WORKORDER_JWT_SECRET: string;
      // 外部用户系统相关
      EXTERNAL_USER_SYSTEM_BASE_URL?: string;
      EXTERNAL_USER_SYSTEM_AUTH_TOKEN?: string;
      // # 密码登录锁定时间
      PASSWORD_LOGIN_LOCK_SECONDS?: string;
    }
  }
}

export {};
