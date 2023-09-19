import * as jwt from 'jsonwebtoken';

export const authLicense = async () =>
  new Promise((resolve, reject) => {
    const license = process.env.LICENSE;
    if (!license) return reject('license is null');

    const key = 'LABRING_FASTGPT_GPT_LICENSE';

    jwt.verify(license, key, function (err, decoded) {
      if (err || !decoded.maxRegister) {
        reject('license is error');
        return;
      }

      console.log(`license loaded: ${JSON.stringify(decoded)}`);

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
