import axios from 'axios';
import { RedirectFn, GetUserInfoFn } from '../type.d';

export const hebamr_redirectFn: RedirectFn = async ({ redirect_uri }) => {
  const targetUrl = process.env.SSO_TARGET_URL as string;
  const appId = process.env.HEBAMR_APP_ID as string;
  if (!appId) {
    return Promise.reject('HEBAMR_APP_ID is required');
  }
  const url = new URL(targetUrl);
  url.searchParams.set('app_id', appId);
  url.searchParams.set('redirect_uri', redirect_uri);

  return { redirectUrl: url.toString() };
};

export const hebamr_getUserInfo: GetUserInfoFn = async (code: string) => {
  const authUrl = process.env.HEBAMR_AUTH_URL as string;
  const getUserInfoUrl = process.env.HEBAMR_GET_USER_INFO_URL as string;
  const appId = process.env.HEBAMR_APP_ID as string;
  const clientId = process.env.HEBAMR_CLIENT_ID as string;
  const clientSecret = process.env.HEBAMR_CLIENT_SECRET as string;

  const { data } = await axios.request({
    url: authUrl,
    method: 'post',
    params: {
      code,
      app_id: appId,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code'
    }
  });
  if (!data.data || !data.data.access_token) {
    return Promise.reject('failed to get access token');
  }
  const accessToken = data.data.access_token;
  const { data: userData } = await axios.get(getUserInfoUrl + accessToken);
  if (!userData.data || !userData.data.account) {
    return Promise.reject('got empty account');
  }
  return {
    username: userData.data.account,
    avatar: '',
    contact: userData.data.mobile ?? ''
  };
};
