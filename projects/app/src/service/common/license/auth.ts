import { MongoUser } from '@fastgpt/service/support/user/schema';
import crypto from 'crypto';
import type { LicenseDataType } from '@fastgpt/global/common/system/types';
import { MongoSystemConfigs } from '@fastgpt/service/common/system/config/schema';
import { SystemConfigsTypeEnum } from '@fastgpt/global/common/system/config/constants';

export const LICENSE_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAuRKwyP8XRYcC8+H17Nrm
0XRa1yRx6CIFnXkg5csSwRka/6KarKXrLirOAeg6icKR69DuP9E4F4NHvYDF6NWl
hGd13vhOg2ABlYx5Mz6e97GPdyHGYtE8ivL9s/ZAjmOAmBntru21Cz2XmmoODW0A
ubuojJY5o1AExDZopeqFfiWLb9Xp1U3+fJfSSTcpwOWJyJbgzeXpe5l6PRMa/1u6
iXjzLmL+wn91EyZpqIB58ZX/89k7cS82iQdNJ14N/yd9GfggV+gXvHNW9SlLkPSm
XsScZ5CjHeejMRrozBpBTzPoYEBRHNtUUFJcTdHsmXx7m5f/9bzPxDV2wgQ1AjoZ
4wN1cqlqtEkz8iwOeDhadS6LQcms9mjiQ61lFFrZxRGWjLWF7AtQmZ5AsR6Rfy+s
uxHhD7WRZzuxz4A7QDZzwXIUnADCA2CDTApttt6O5x9Q8XoVGr01jS88wX+fVq3V
YHKhgblQh1XUqCBmeeMeK3J/7ipWriHRrhp0yG/m9CROZp8nzdl4pRkO0CKJXe4r
NXNQe93HY91bjP+gWHVLV8P3xk08VVrdE1SM4eQYCQg+8YOpD3DEWBTAtvdknayf
Hvg2QTVvOHHwcIlSCo26ZpXOOE/El/3ZspJ7bWwIMckeN0x9guLTpc2W4jE6dY83
RZ7iPiNjuE6X10nchsf2OzsCAwEAAQ==
-----END PUBLIC KEY-----`;
const signatureLength = 684;

const licenseDefaultData: LicenseDataType['functions'] = {
  sso: false,
  pay: false,
  customTemplates: false,
  datasetEnhance: false,
  batchEval: false
};

export async function authLicense(license?: string) {
  const licenseStr = await (async () => {
    if (license && typeof license === 'string') return license;

    const data = await MongoSystemConfigs.findOne({ type: SystemConfigsTypeEnum.license });
    if (data) return data.value?.license as string;
  })();

  try {
    if (!licenseStr) {
      return Promise.reject('未读取到 License');
    }

    const signature = licenseStr.substring(0, signatureLength);
    const payload = licenseStr.substring(signatureLength);

    const verified = crypto
      .createVerify('RSA-SHA256')
      .update(payload)
      .verify(LICENSE_PUBLIC_KEY, signature, 'base64');

    if (!verified) {
      return Promise.reject('License 不合法');
    }

    const licenseData: LicenseDataType = JSON.parse(
      Buffer.from(payload, 'base64').toString('utf8')
    );

    // auth date
    if (new Date(licenseData.expiredTime).getTime() < Date.now()) {
      return Promise.reject('License 已过期');
    }
    if (!licenseData.functions) {
      return Promise.reject('License 内容错误');
    }

    // 与 defaultFunction 进行一次合并
    for (const key in licenseDefaultData) {
      // @ts-ignore
      licenseData.functions[key] = licenseData.functions[key] ?? licenseDefaultData[key];
    }

    console.log(
      `License 校验成功，${licenseData.company}, 过期时间: ${licenseData.expiredTime}，功能清单：
- 最大用户数：${licenseData.maxUsers || '不限制'}
- 最大应用数：${licenseData.maxApps || '不限制'}
- 最大知识库数量：${licenseData.maxDatasets || '不限制'}
- SSO: ${licenseData.functions.sso}
- 支付系统：${licenseData.functions.pay}
- 自定义模板和系统工具: ${licenseData.functions.customTemplates}
- 知识库增强: ${licenseData.functions.datasetEnhance}`
    );
    return licenseData;
  } catch (error) {
    console.log(error);
    console.log(licenseStr, 111);
    global.licenseData = undefined;
    return Promise.reject('License 不合法');
  }
}

export const licenseAuth = {
  authMaxUsers: async () => {
    if (!global.licenseData) {
      return Promise.reject('系统未激活');
    }
    if (!global.licenseData.maxUsers) {
      return;
    }
    const usersCount = await MongoUser.countDocuments();

    if (usersCount > global.licenseData.maxUsers) return Promise.reject('超过最大用户数');
  },
  authDatasetEnhance: async () => {
    if (!global.licenseData) {
      return Promise.reject('系统未激活');
    }
    if (!global.licenseData.functions.datasetEnhance) {
      return;
    }
  }
};
