import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { SubDatasetSizeParams } from '@fastgpt/global/support/wallet/sub/api';
import { MongoTeamSub } from '@fastgpt/service/support/wallet/sub/schema';
import { getMonthRemainingDays } from '@fastgpt/global/common/math/date';
import {
  SubModeEnum,
  SubStatusEnum,
  SubTypeEnum
} from '@fastgpt/global/support/wallet/sub/constants';
import { BillSourceEnum, PRICE_SCALE } from '@fastgpt/global/support/wallet/bill/constants';
import { authTeamBalance } from '@/service/support/user/team/utils';
import { updateTeamBalance } from '@/service/support/wallet/controller';
import { MongoBill } from '@fastgpt/service/support/wallet/bill/schema';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { size, renew } = req.body as SubDatasetSizeParams;

  const DatasetStorePrice = global.systemConfig?.subscription?.datasetStorePrice || 0;

  try {
    if (size < 0) {
      throw new Error('Size must be greater than 0');
    }

    await connectToDatabase();
    const { teamId, tmbId } = await authCert({ req, authToken: true });

    // 找订阅记录
    const sub = await MongoTeamSub.findOne({
      teamId,
      type: SubTypeEnum.datasetStore
    });

    // 如果记录过期，设置为0
    if (sub && sub.status === SubStatusEnum.expired) {
      sub.datasetStoreAmount = 0;
    }

    const remainDays = getMonthRemainingDays();
    // 月初第一天过期(定时任务会去根据该事件去扫描扣款，扣款失败则进入过期，成功则延续到下一个月)
    const expiredTime = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1, 0, 0, 0);
    const price = Math.round((remainDays / 30) * size * DatasetStorePrice * PRICE_SCALE);
    const expandSize = size * 1000;

    // 校验余额
    if (price > 0) {
      await authTeamBalance(teamId, price);
    }

    // 扣费 & 创建订单
    if (price > 0) {
      await MongoBill.create({
        teamId,
        tmbId,
        appName: '知识库扩容',
        total: price,
        source: BillSourceEnum.datasetExpand
      });
      await updateTeamBalance({
        teamId,
        amount: -price
      });
    }

    if (!sub) {
      await MongoTeamSub.create({
        teamId,
        type: SubTypeEnum.datasetStore,
        mode: SubModeEnum.month,
        status: SubStatusEnum.active,
        startTime: new Date(),
        expiredTime,
        datasetStoreAmount: expandSize,
        renew
      });
    } else {
      sub.status = SubStatusEnum.active;
      sub.renew = renew;

      sub.expiredTime = expiredTime;
      if (sub.datasetStoreAmount !== undefined) {
        sub.datasetStoreAmount += expandSize;
      } else {
        sub.datasetStoreAmount = expandSize;
      }
      sub.save();
    }

    jsonRes(res);
  } catch (err) {
    console.log(err);

    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
