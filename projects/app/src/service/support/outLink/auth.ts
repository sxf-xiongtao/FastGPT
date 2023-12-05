import { authIpLimit } from '@/service/common/ipLimit/tools';
import { PRICE_SCALE } from '@fastgpt/global/support/wallet/bill/constants';
import type {
  AuthOutLinkInitProps,
  AuthOutLinkLimitProps,
  AuthOutLinkResponse
} from '@fastgpt/global/support/outLink/api.d';
import axios from 'axios';
import { OutLinkErrEnum } from '@fastgpt/global/common/error/code/outLink';

export type TokenAuthResponseType = {
  success: boolean;
  msg?: string;
  message?: string;
  data?: AuthOutLinkResponse;
};

export async function authOutLinkLimit({
  outLink,
  ip,
  authToken,
  question
}: AuthOutLinkLimitProps): Promise<AuthOutLinkResponse> {
  if (!ip || !outLink.limit) {
    return {};
  }

  //   expiredTime already to string
  if (outLink.limit.expiredTime && new Date(outLink.limit.expiredTime).getTime() < Date.now()) {
    return Promise.reject('分享链接已过期');
  }

  if (outLink.limit.credit > -1 && outLink.total > outLink.limit.credit * PRICE_SCALE) {
    return Promise.reject('链接超出使用限制');
  }

  // ip limit
  await authIpLimit({ ip, outLink });

  // url auth. send request
  return authStartChat({ authToken, tokenUrl: outLink.limit.hookUrl, question });
}

async function authStartChat({
  tokenUrl,
  authToken,
  question
}: {
  authToken?: string;
  question: string;
  tokenUrl?: string;
}): Promise<AuthOutLinkResponse> {
  if (!tokenUrl) return {};
  try {
    const { data } = await axios<TokenAuthResponseType>({
      baseURL: tokenUrl,
      url: '/shareAuth/start',
      method: 'POST',
      data: {
        token: authToken,
        question
      }
    });

    if (data?.success !== true) {
      return Promise.reject(data?.message || data?.msg || '身份校验失败');
    }

    return data.data || {};
  } catch (error) {
    return Promise.reject('身份校验失败');
  }
}

export async function authOutLinkInit({
  tokenUrl,
  authToken
}: AuthOutLinkInitProps): Promise<AuthOutLinkResponse> {
  if (!tokenUrl) return {};

  const { data } = await axios<TokenAuthResponseType>({
    baseURL: tokenUrl,
    url: '/shareAuth/init',
    method: 'POST',
    data: {
      token: authToken
    }
  });
  if (data?.success !== true) {
    return Promise.reject(data?.message || data?.msg || OutLinkErrEnum.unAuthUser);
  }
  return data.data || {};
}
