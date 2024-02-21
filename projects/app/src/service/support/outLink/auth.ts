import { authIpLimit } from '@/service/common/ipLimit/tools';
import { PRICE_SCALE } from '@fastgpt/global/support/wallet/constants';
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
  outLinkUid,
  question
}: AuthOutLinkLimitProps): Promise<AuthOutLinkResponse> {
  if (!ip || !outLink.limit) {
    return { uid: outLinkUid };
  }

  //   expiredTime already to string
  if (outLink.limit.expiredTime && new Date(outLink.limit.expiredTime).getTime() < Date.now()) {
    return Promise.reject('分享链接已过期');
  }

  if (
    outLink.limit.maxUsagePoints &&
    outLink.limit.maxUsagePoints > -1 &&
    outLink.usagePoints > outLink.limit.maxUsagePoints
  ) {
    return Promise.reject('链接超出使用限制');
  }

  // ip limit
  await authIpLimit({ ip, outLink });

  // url auth. send request
  if (!outLink.limit.hookUrl) {
    return { uid: outLinkUid };
  }
  try {
    const { data } = await axios<TokenAuthResponseType>({
      baseURL: outLink.limit.hookUrl,
      url: '/shareAuth/start',
      method: 'POST',
      data: {
        token: outLinkUid,
        question
      }
    });

    if (data?.success !== true) {
      return Promise.reject(data?.message || data?.msg || '身份校验失败');
    }

    return { uid: data?.data?.uid || outLinkUid };
  } catch (error) {
    return Promise.reject('身份校验失败');
  }
}

export async function authOutLinkInit({
  tokenUrl,
  outLinkUid
}: AuthOutLinkInitProps): Promise<AuthOutLinkResponse> {
  if (!tokenUrl) return { uid: outLinkUid };

  const { data } = await axios<TokenAuthResponseType>({
    baseURL: tokenUrl,
    url: '/shareAuth/init',
    method: 'POST',
    data: {
      token: outLinkUid
    }
  });
  if (data?.success !== true) {
    return Promise.reject(data?.message || data?.msg || OutLinkErrEnum.unAuthUser);
  }
  return {
    uid: data?.data?.uid || outLinkUid
  };
}
