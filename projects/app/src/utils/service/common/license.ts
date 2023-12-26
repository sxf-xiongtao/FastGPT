import crypto from 'crypto';
import { LicenseDataType } from '@/types';
import { readFileSync } from 'fs';

export const LICENSE_PUBLIC_KEY = `-----BEGIN PRIVATE KEY-----
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
SN2dSdtwlojkOB6cVqpn8vvziPL0ERVD
-----END PRIVATE KEY-----
`;

export async function authLicense() {
  try {
    const filename =
      process.env.NODE_ENV === 'development' ? 'data/config.local.json' : '/app/data/config.json';
    const res = JSON.parse(readFileSync(filename, 'utf-8'));

    const license = res.license || '';
    const buffer = Buffer.from(license, 'base64');
    const decrypted = crypto.privateDecrypt(
      {
        key: LICENSE_PUBLIC_KEY,
        passphrase: ''
      },
      buffer
    );
    const licenseData = JSON.parse(decrypted.toString('utf8')) as LicenseDataType;

    // auth date
    if (new Date(licenseData.expTime).getTime() < Date.now()) {
      return Promise.reject('License 已过期');
    }
    global.licenseData = licenseData;
    console.log(
      `商业版插件加载成功，${licenseData.company}, 过期时间: ${licenseData.expTime}, 最大用户: ${licenseData.maxRegister}`
    );
    return;
  } catch (error) {
    console.log(error);
    return Promise.reject('License 不合法');
  }
}
