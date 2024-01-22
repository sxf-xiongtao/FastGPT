import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { MongoTeamSub } from '@fastgpt/service/support/wallet/sub/schema';
import { SubStatusEnum, SubTypeEnum } from '@fastgpt/global/support/wallet/sub/constants';
import { PRICE_SCALE } from '@fastgpt/global/support/wallet/bill/constants';
import { calculateDaysBetweenDates } from '@fastgpt/global/common/math/date';
import { MongoPay } from '@/service/support/wallet/pay/schema';
import { PayTypeEnum } from '@fastgpt/global/support/wallet/pay/constants';

/* 初始化旧的订阅字段 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await authCert({ req, authRoot: true });
    await connectToDatabase();
    const DatasetStorePrice =
      (global.systemConfig?.subscription?.datasetStorePrice || 0) * PRICE_SCALE;

    // 更新 type 成新的
    await MongoTeamSub.updateMany(
      { type: 'datasetStore' },
      { $set: { type: SubTypeEnum.extraDatasetSize } }
    );

    // 把 datasetStoreAmount ，赋值给currentExtraDatasetSize和nextExtraDatasetSize
    const subs = await MongoTeamSub.find({ type: SubTypeEnum.extraDatasetSize }).lean();
    await Promise.all(
      subs.map((sub) => {
        const datasetStoreAmount = sub.datasetStoreAmount || 0;
        // 计算 startTime 到月底的天数
        const day = calculateDaysBetweenDates(sub.startTime, sub.expiredTime);
        const lastSubPrice = Math.round(
          (day / 30) * (datasetStoreAmount / 1000) * DatasetStorePrice
        );

        console.log({
          DatasetStorePrice,
          day,
          currentExtraDatasetSize: datasetStoreAmount,
          nextExtraDatasetSize: datasetStoreAmount,
          status: sub.renew ? SubStatusEnum.active : SubStatusEnum.canceled, // renew=false 代表不再续费
          price: lastSubPrice // 上期的订阅价格记录为0，会临时影响升配的价格
        });

        return MongoTeamSub.findByIdAndUpdate(sub._id, {
          $set: {
            currentExtraDatasetSize: datasetStoreAmount,
            nextExtraDatasetSize: datasetStoreAmount,
            status: sub.renew ? SubStatusEnum.active : SubStatusEnum.canceled, // renew=false 代表不再续费
            price: lastSubPrice // 上期的订阅价格记录为0，会临时影响升配的价格
          }
        });
      })
    );

    // 更新 pay 的type成balance
    await MongoPay.updateMany(
      { type: { $exists: false } },
      { $set: { type: PayTypeEnum.balance } }
    );

    jsonRes(res, {
      message: 'success'
    });
  } catch (error) {
    console.log(error);

    jsonRes(res, {
      code: 500,
      error
    });
  }
}
