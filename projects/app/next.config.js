const { i18n } = require('./next-i18next.config');
const path = require('path');
const fs = require('fs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  i18n,
  output: 'standalone',
  reactStrictMode: process.env.NODE_ENV === 'development' ? false : true,
  compress: true,
  webpack(config, { isServer, nextRuntime }) {
    Object.assign(config.resolve.alias, {
      '@mongodb-js/zstd': false,
      '@aws-sdk/credential-providers': false,
      snappy: false,
      aws4: false,
      'mongodb-client-encryption': false,
      kerberos: false,
      'supports-color': false,
      'bson-ext': false,
      'pg-native': false
    });
    config.module = {
      ...config.module,
      rules: config.module.rules.concat([
        {
          test: /\.svg$/i,
          issuer: /\.[jt]sx?$/,
          use: ['@svgr/webpack']
        },
        {
          test: /\.node$/,
          use: [{ loader: 'nextjs-node-loader' }]
        }
      ]),
      exprContextCritical: false,
      unknownContextCritical: false
    };

    if (isServer) {
      config.externals.push('worker_threads');

      if (nextRuntime === 'nodejs') {
        // config.output.globalObject = 'self';

        const oldEntry = config.entry;
        config = {
          ...config,
          async entry(...args) {
            const entries = await oldEntry(...args);
            return {
              ...entries,
              ...getWorkerConfig(),
              'worker/systemPluginRun': path.resolve(
                process.cwd(),
                '../../FastGPT/packages/plugins/runtime/worker.ts'
              )
            };
          }
        };
      }
    } else {
      config.resolve = {
        ...config.resolve,
        fallback: {
          ...config.resolve.fallback,
          fs: false
        }
      };
      if (!config.externals) {
        config.externals = [];
      }
    }

    return config;
  },
  transpilePackages: ['@fastgpt/*', 'ahooks', '@chakra-ui/*', 'react'],
  experimental: {
    // 指定导出包优化，按需引入包模块
    serverComponentsExternalPackages: ['mongoose', 'pg', '@node-rs/jieba'],
    outputFileTracingRoot: path.join(__dirname, '../../')
  }
};

module.exports = nextConfig;

function getWorkerConfig() {
  const baseUrl = path.resolve(__dirname, '../../FastGPT/packages/service/worker')
  const result = fs.readdirSync(baseUrl);

  // 获取所有的目录名
  const folderList = result.filter((item) => {
    return fs
      .statSync(path.resolve(baseUrl, item))
      .isDirectory();
  });

  const workerConfig = folderList.reduce((acc, item) => {
    acc[`worker/${item}`] = path.resolve(
      process.cwd(),
      `../../FastGPT/packages/service/worker/${item}/index.ts`
    );
    return acc;
  }, {});
  return workerConfig;
}
