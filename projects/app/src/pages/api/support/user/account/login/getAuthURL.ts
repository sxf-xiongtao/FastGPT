import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import axios from 'axios';

export type GetRedirectURLQuery = {};
export type GetRedirectURLBody = {
  redirectUri: string;
  isWecomWorkTerminal?: boolean;
};
export type GetRedirectURLResponse = {};

async function handler(
  req: ApiRequestProps<GetRedirectURLBody, GetRedirectURLQuery>,
  res: ApiResponseType<any>
): Promise<GetRedirectURLResponse> {
  const { redirectUri: redirect_uri, isWecomWorkTerminal } = req.body;
  if (!global.feConfigs.sso?.url) {
    return Promise.reject(new Error('SSO is not configured'));
  }
  const { data } = await axios.get<{
    success: boolean;
    message: string;
    authURL: string;
  }>(`${global.feConfigs.sso?.url}/login/oauth/getAuthURL`, {
    params: {
      redirect_uri,
      isWecomWorkTerminal
    }
  });

  if (!data.success) {
    return Promise.reject(new Error(data.message));
  }
  return data.authURL;
}
export default NextAPI(handler);
