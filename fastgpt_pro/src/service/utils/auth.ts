import type { NextApiRequest } from 'next';
import Cookie from 'cookie';
import { User, OpenApi } from '../mongo';
import { ERROR_ENUM } from '../errorCode';
import { authJWT } from './tools';
import jwt from 'jsonwebtoken';

export enum AuthUserTypeEnum {
  token = 'token',
  root = 'root',
  apikey = 'apikey'
}

export const authLicense = async () =>
  new Promise((resolve, reject) => {
    const license = global.systemConfig.license;

    if (!license) return reject('license is null');

    const key = process.env.LICENSE_KEY;

    // @ts-ignore
    jwt.verify(license, key, function (err, decoded: LicenseDataType) {
      console.log(decoded);

      if (err || !decoded.maxRegister) {
        reject('license is error');
        return;
      }

      global.licenseData = decoded;

      resolve('');
    });
  });

export const authCookieToken = async (cookie?: string, token?: string): Promise<string> => {
  // 获取 cookie
  const cookies = Cookie.parse(cookie || '');
  const cookieToken = cookies.token || token;

  if (!cookieToken) {
    return Promise.reject(ERROR_ENUM.unAuthorization);
  }

  return await authJWT(cookieToken);
};

/* auth balance */
export const authBalanceByUid = async (uid: string) => {
  const user = await User.findById(uid);
  if (!user) {
    return Promise.reject(ERROR_ENUM.unAuthorization);
  }

  if (user.balance <= 0) {
    return Promise.reject(ERROR_ENUM.insufficientQuota);
  }
  return user;
};

/* uniform auth user */
export const authUser = async ({
  req,
  authToken = false,
  authRoot = false,
  authBalance = false
}: {
  req: NextApiRequest;
  authToken?: boolean;
  authRoot?: boolean;
  authBalance?: boolean;
}) => {
  const parseOpenApiKey = async (apiKey?: string) => {
    if (!apiKey) {
      return Promise.reject(ERROR_ENUM.unAuthorization);
    }

    try {
      const openApi = await OpenApi.findOne({ apiKey });
      if (!openApi) {
        return Promise.reject(ERROR_ENUM.unAuthorization);
      }
      const userId = String(openApi.userId);

      // 更新使用的时间
      await OpenApi.findByIdAndUpdate(openApi._id, {
        lastUsedTime: new Date()
      });

      return userId;
    } catch (error) {
      return Promise.reject(error);
    }
  };
  const parseAuthorization = async (authorization?: string) => {
    if (!authorization) {
      return Promise.reject(ERROR_ENUM.unAuthorization);
    }

    // Bearer fastgpt-xxxx-appId
    const auth = authorization.split(' ')[1];
    if (!auth) {
      return Promise.reject(ERROR_ENUM.unAuthorization);
    }

    const { apiKey, appId } = await (async () => {
      const arr = auth.split('-');
      if (arr.length !== 3) {
        return Promise.reject(ERROR_ENUM.unAuthorization);
      }
      return {
        apiKey: `${arr[0]}-${arr[1]}`,
        appId: arr[2]
      };
    })();

    // auth apiKey
    const uid = await parseOpenApiKey(apiKey);

    return {
      uid,
      appId
    };
  };
  const parseRootKey = async (rootKey?: string, userId = '') => {
    if (!rootKey || !process.env.ROOT_KEY || rootKey !== process.env.ROOT_KEY) {
      return Promise.reject(ERROR_ENUM.unAuthorization);
    }
    return userId;
  };

  const { cookie, token, apikey, rootkey, userid, authorization } = (req.headers || {}) as {
    cookie?: string;
    token?: string;
    apikey?: string;
    rootkey?: string;
    userid?: string;
    authorization?: string;
  };

  let uid = '';
  let appId = '';
  let authType: `${AuthUserTypeEnum}` = AuthUserTypeEnum.token;

  if (authToken) {
    uid = await authCookieToken(cookie, token);
    authType = AuthUserTypeEnum.token;
  } else if (authRoot) {
    uid = await parseRootKey(rootkey, userid);
    authType = AuthUserTypeEnum.root;
  } else if (cookie || token) {
    uid = await authCookieToken(cookie, token);
    authType = AuthUserTypeEnum.token;
  } else if (apikey) {
    uid = await parseOpenApiKey(apikey);
    authType = AuthUserTypeEnum.apikey;
  } else if (authorization) {
    const authResponse = await parseAuthorization(authorization);
    uid = authResponse.uid;
    appId = authResponse.appId;
    authType = AuthUserTypeEnum.apikey;
  } else if (rootkey) {
    uid = await parseRootKey(rootkey, userid);
    authType = AuthUserTypeEnum.root;
  } else {
    return Promise.reject(ERROR_ENUM.unAuthorization);
  }

  // balance check
  const user = await (() => {
    if (authBalance) {
      return authBalanceByUid(uid);
    }
  })();

  return {
    userId: uid,
    appId,
    authType,
    user
  };
};
