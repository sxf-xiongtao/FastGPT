import { RedirectFn, GetUserInfoFn } from '../type.d';
import axios from 'axios';

export const tcl_redirectFn: RedirectFn = async ({ state }) => {
  const targetUrl = process.env.SSO_TARGET_URL as string;

  // 解析 redirect_uri，然后给他带上 state，redirect_uri本身可能已经是带参数的
  const url = new URL(targetUrl);
  // url.searchParams.set('state', state);
  const redirectUrl = url.toString();

  return { redirectUrl };
};

export const TCL_getUserInfo: GetUserInfoFn = async (code: string) => {
  const TOKENURL = process.env.TCL_TOKEN_URL as string;
  const GET_USER_INFO_URL = process.env.TCL_GET_USER_INFO_URL as string;
  const CLIENT_ID = process.env.TCL_CLIENT_ID as string;
  const CLIENT_SECRET = process.env.TCL_CLIENT_SECRET as string;
  const REDIRECT_URI = process.env.TCL_REDIRECT_URI as string;

  const { data } = await axios.request({
    url: TOKENURL,
    method: 'post',
    params: {
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'authorization_code',
      redirect_uri: REDIRECT_URI
    }
  });

  const access_token = data.access_token;
  const { data: userInfo } = await axios.request<{
    id: string;
    attributes: {
      [key: string]: string;
    }[];
  }>({
    url: GET_USER_INFO_URL,
    method: 'get',
    params: {
      access_token
    }
  });

  const attributes = {} as Record<string, string>;

  userInfo.attributes.forEach((attr) => {
    const key = Object.keys(attr)[0];
    const value = attr[key];
    attributes[key] = value;
  });

  return {
    username: 'tcl-' + attributes['uid'],
    avatar: '',
    contact: attributes['mobile'] || attributes['mail']
  };
};
