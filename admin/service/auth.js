import * as jwt from 'jsonwebtoken';

export const authLicense = async () =>
  new Promise((resolve, reject) => {
    const license = process.env.LICENSE;
    if (!license) return reject('license is null');

    const key = process.env.LICENSE_KEY;

    jwt.verify(license, key, function (err, decoded) {
      if (err || !decoded.maxRegister) {
        reject('license is error');
        return;
      }

      resolve('');
    });
  });

export const initAuthLicense = async () => {
  try {
    await authLicense();
  } catch (error) {
    throw new Error('License 不合法');
  }
};
