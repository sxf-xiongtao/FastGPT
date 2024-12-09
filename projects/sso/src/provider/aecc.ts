import axios from 'axios';
import xml2js from 'xml2js';
import { RedirectFn, GetUserInfoFn, CallbackFn } from '../type.d';
import { getTmpValue, setTmpValue } from 'global';
import { Request } from 'express';

const global = globalThis as typeof globalThis & {
  aecc_redirect_uri: string | undefined;
};

const getService = (req: Request) =>
  new URL(`${req.protocol}://${req.get('host')}/login/oauth/callback`);

export const aecc_redirectFn: RedirectFn = async ({ req, redirect_uri }) => {
  const service = getService(req);

  // 缓存 redirect_uri，用于二次跳转
  global.aecc_redirect_uri = redirect_uri;
  // Target URL e.g. http://example.com/CAS/login
  const targetUrl = process.env.SSO_TARGET_URL as string;
  const url = new URL(targetUrl);
  url.searchParams.set('service', service.toString());

  return { redirectUrl: url.toString() };
};

export const aecc_callbackFn: CallbackFn = async ({ req }) => {
  const { ticket } = req.query as { ticket: string };
  const service = getService(req);

  if (!ticket) {
    return Promise.reject('Invalid ticket');
  }
  const redirect_uri = global.aecc_redirect_uri;
  if (!redirect_uri) {
    return Promise.reject('Invalid redirect_uri');
  }
  // 二次跳转
  const url = `${redirect_uri}?code=${ticket}`;

  setTmpValue(ticket, service.toString());

  return { redirectUrl: url };
};

export const aecc_getUserInfo: GetUserInfoFn = async (code: string) => {
  const validateUrl = process.env.AECC_SERVICE_VALIDATE_URL as string;
  const service = getTmpValue<string>(code);
  if (!service) {
    return Promise.reject('Invalid code');
  }

  try {
    const { data } = await axios.get(validateUrl, {
      params: {
        ticket: code,
        service: service
      }
    });

    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(data);
    if (!result.cas.authenticationSuccess || !result.cas.authenticationSuccess[0].user[0]) {
      return Promise.reject('Invalid ticket or unauthorized');
    }

    const user: string = result.cas.authenticationSuccess[0].user[0];

    return {
      username: user,
      avatar: '',
      contact: ''
    };
  } catch (e) {
    console.error('Unable to varify the code', e);
    return Promise.reject('Verify failed, due to bad response');
  }
};
