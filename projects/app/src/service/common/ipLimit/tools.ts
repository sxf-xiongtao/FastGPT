import type { OutLinkSchema } from '@fastgpt/global/support/outLink/type.d';
import { MongoIpLimit } from './schema';
import axios from 'axios';
import { addLog } from '@fastgpt/service/common/system/log';
import { Obj2Query } from '@/utils/tools';
import { AuthGoogleTokenProps } from '@fastgpt/global/common/system/api';

export async function authIpLimit({ ip, outLink }: { ip: string; outLink: OutLinkSchema }) {
  if (!outLink.limit) {
    return;
  }

  const ipLimit = await MongoIpLimit.findOne({ ip, eventId: outLink._id });

  // first request
  if (!ipLimit) {
    return await MongoIpLimit.create({
      eventId: outLink._id,
      ip,
      account: outLink.limit.QPM - 1
    });
  }
  // over one minute
  const diffTime = Date.now() - ipLimit.lastMinute.getTime();
  if (diffTime >= 60 * 1000) {
    ipLimit.account = outLink.limit.QPM - 1;
    ipLimit.lastMinute = new Date();
    return await ipLimit.save();
  }
  // over limit
  if (ipLimit.account <= 0) {
    return Promise.reject(
      `每分钟仅能请求 ${outLink.limit.QPM} 次, ${60 - Math.round(diffTime / 1000)}s 后重试~`
    );
  }
  // update limit
  ipLimit.account = ipLimit.account - 1;
  await ipLimit.save();
}

// service run
export const authGoogleToken = async (data: AuthGoogleTokenProps) => {
  if (!global.systemConfig?.auth?.googleServiceVerKey) return;

  const res = await axios.post<{
    score?: number;
    success: boolean;
    'error-codes': string[];
  }>(
    `https://www.recaptcha.net/recaptcha/api/siteverify?${Obj2Query({
      secret: global.systemConfig?.auth?.googleServiceVerKey,
      response: data.googleToken,
      remoteip: data.remoteip
    })}`
  );

  addLog.info('谷歌校验结果', res?.data);

  if (res.data.success) {
    return Promise.resolve('');
  }

  return Promise.reject('您的操作环境存在异常，请刷新页面后重试或联系客服。');
};
