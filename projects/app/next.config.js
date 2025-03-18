const { i18n } = require('./next-i18next.config.js');
const path = require('path');
const fs = require('fs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: process.env.NEXT_PUBLIC_BASE_URL,
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
        }
      ]),
      exprContextCritical: false,
      unknownContextCritical: false
    };

    if (!config.externals) {
      config.externals = [];
    }

    if (isServer) {
      config.externals.push('worker_threads');
      config.externals.push('@node-rs/jieba');

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
  transpilePackages: ['@fastgpt/global', '@fastgpt/web', 'ahooks'],
  experimental: {
    // 指定导出包优化，按需引入包模块
    serverComponentsExternalPackages: [
      'mongoose',
      'pg',
      '@zilliz/milvus2-sdk-node',
      "tiktoken",
    ],
    outputFileTracingRoot: path.join(__dirname, '../../'),
    instrumentationHook: true
  }
};

module.exports = nextConfig;

function getWorkerConfig() {
  const baseUrl = path.resolve(__dirname, '../../FastGPT/packages/service/worker');
  const result = fs.readdirSync(baseUrl);

  // 获取所有的目录名
  const folderList = result.filter((item) => {
    return fs.statSync(path.resolve(baseUrl, item)).isDirectory();
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
