import axios from 'axios';
import xml2js from 'xml2js';
import { RedirectFn, GetUserInfoFn, CallbackFn } from '../type.d';
import { getTmpValue, setTmpValue } from 'global';

export const aecc_redirectFn: RedirectFn = async ({ req, redirect_uri }) => {
  const service = new URL(`${req.protocol}://${req.get('host')}/login/oauth/callback`);
  service.searchParams.set('redirect_uri', redirect_uri);

  // Target URL e.g. http://example.com/CAS/login
  const targetUrl = process.env.SSO_TARGET_URL as string;
  const url = new URL(targetUrl);
  url.searchParams.set('service', service.toString());

  return { redirectUrl: url.toString() };
};

export const aecc_callbackFn: CallbackFn = async ({ req, redirect_uri }) => {
  const { ticket } = req.query as { ticket: string };
  const service = new URL(req.protocol + '://' + req.get('host') + req.originalUrl);
  if (!ticket) {
    return Promise.reject('Invalid ticket');
  }

  // 二次跳转
  const url = `${redirect_uri}?code=${ticket}`;
  service.searchParams.delete('ticket');

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
