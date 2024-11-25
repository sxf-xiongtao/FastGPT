//next-i18next.config.js
/**
 * @type {import('next-i18next').UserConfig}
 */

module.exports = {
  i18n: {
    defaultLocale: 'zh-CN',
    locales: ['en', 'zh-CN', 'zh-TW'],
    localeDetection: false
  },
  localePath: require('path').resolve('../../FastGPT/packages/web/i18n'),
  reloadOnPrerender: process.env.NODE_ENV === 'development'
};
