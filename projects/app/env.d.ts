declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // 评估
      EVAL_CONCURRENCY: string;
      EVAL_LINE_LIMIT: string;
      // 账单更新频率
      UPDATE_BALANCE_DELAY: string;
      // 开票通知（飞书 webhook 和对应按键的回调地址）
      INVOICE_FEISHU_WEBHOOK_URL: string;
      INVOICE_FEISHU_WEBHOOK_CALLBACK_URL: string;
      // 发送 SMS 的代理地址
      SMS_PROXY: string;
      // 网络爬虫最大页面数
      MAX_CRAWL_PAGE: string;
      // 是否启用动态页面爬虫, 默认关闭
      CRAWL_DYNAMIC_WEBSITE: string;
      // 爬虫过滤域名 (使用半角逗号分割多个域名)
      CRAWL_EXCLUDE_LIST: string;
      // 百度转化跟踪
      BAIDU_CONVERSION_TOKEN: string;
      BAIDU_CONVERSION_BASE_URL: string;
      // 是否展示 Git 信息，不填写的话就不展示
      SHOW_GIT: string;
      // 清理免费用户
      WARN_FREE_ACCOUNT: string;
      CLEAR_FREE_ACCOUNT: string;
      // 飞书私有化地址
      FEISHU_BASE_URL: string;
      // 语雀知识库默认根地址
      YUQUE_DATASET_BASE_URL: string;
      // 成员自动同步
      SYNC_MEMBER_CRON: string;
      // Workorder 工单相关
      WORKORDER_BASE_URL: string;
      WORKORDER_JWT_SECRET: string;
      // 外部用户系统相关
      EXTERNAL_USER_SYSTEM_BASE_URL?: string;
      EXTERNAL_USER_SYSTEM_AUTH_TOKEN?: string;

      // 百度转化跟踪
      BAIDU_CONVERSION_TOKEN?: string;
      BAIDU_CONVERSION_BASE_URL?: string;
      // Bing 转化跟踪
      BING_ADS_DEVELOPER_TOKEN?: string;
      BING_ADS_CUSTOMER_ID?: string;
      BING_ADS_CUSTOMER_ACCOUNT_ID?: string;
      BING_ADS_CONVERSION_Name?: string;
      // Bing OAuth 2.0
      BING_OAUTH_CLIENT_ID?: string;
      BING_OAUTH_CLIENT_SECRET?: string;
      BING_OAUTH_REFRESH_TOKEN?: string;
    }
  }
}

export {};
