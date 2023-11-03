import { authIpLimit } from '@/service/common/ipLimit/tools';
import { PRICE_SCALE } from '@fastgpt/global/support/wallet/bill/constants';
import type { AuthLinkLimitProps } from '@fastgpt/service/support/outLink/auth';
import axios from 'axios';
export type TokenAuthResponseType = {
  success: boolean;
  msg?: string;
  message?: string;
};

export async function authOutLinkLimit({ outLink, ip, authToken, question }: AuthLinkLimitProps) {
  if (!ip || !outLink.limit) {
    return;
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
  await authShareStart({ authToken, tokenUrl: outLink.limit.hookUrl, question });
}

export async function authShareStart({
  tokenUrl,
  authToken,
  question
}: {
  authToken?: string;
  question: string;
  tokenUrl?: string;
}) {
  if (!tokenUrl) return;
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
  } catch (error) {
    return Promise.reject('身份校验失败');
  }
}
