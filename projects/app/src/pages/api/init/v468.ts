import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { MongoTeamSub } from '@fastgpt/service/support/wallet/sub/schema';
import { SubStatusEnum, SubTypeEnum } from '@fastgpt/global/support/wallet/sub/constants';
import { calculateDaysBetweenDates } from '@fastgpt/global/common/math/date';
import { MongoPay } from '@/service/support/wallet/pay/schema';
import { PayTypeEnum } from '@fastgpt/global/support/wallet/pay/constants';
import { MongoTeam } from '@fastgpt/service/support/user/team/teamSchema';
import { delay } from '@fastgpt/global/common/system/utils';
import {
  createTeamFreeSubPlan,
  getExtraDatasetSizePrice
} from '@/service/support/wallet/sub/utils';

/* 初始化旧的订阅字段 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await authCert({ req, authRoot: true });
    await connectToDatabase();

    // 更新 pay 的type成balance
    await MongoPay.updateMany(
      { type: { $exists: false } },
      { $set: { type: PayTypeEnum.balance } }
    );

    await updateOldExtraDatasetSub();

    jsonRes(res, {
      data: {
        teamLength: await addTeamDefaultSub(),
        updateSubModeLength: await updateSubMode()
      },
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

const updateOldExtraDatasetSub = async () => {
  const DatasetStorePrice = getExtraDatasetSizePrice('store');

  // 更新旧的订阅 type 成新的
  await MongoTeamSub.updateMany(
    { type: 'datasetStore' },
    { $set: { type: SubTypeEnum.extraDatasetSize } }
  );

  // 把旧的知识库容量， datasetStoreAmount ，赋值给currentExtraDatasetSize和nextExtraDatasetSize
  const subs = await MongoTeamSub.find({
    type: SubTypeEnum.extraDatasetSize,
    currentExtraDatasetSize: { $exists: false },
    nextExtraDatasetSize: { $exists: false }
  }).lean();

  await Promise.all(
    subs.map((sub) => {
      const datasetStoreAmount = sub.datasetStoreAmount || 0;
      // 计算 startTime 到月底的天数
      const day = calculateDaysBetweenDates(sub.startTime, sub.expiredTime);
      const lastSubPrice = Math.round((day / 30) * (datasetStoreAmount / 1000) * DatasetStorePrice);

      console.log({
        DatasetStorePrice,
        day,
        currentExtraDatasetSize: datasetStoreAmount,
        nextExtraDatasetSize: datasetStoreAmount,
        status: sub.renew ? SubStatusEnum.active : SubStatusEnum.canceled, // renew=false 代表不再续费
        price: lastSubPrice // 上期的订阅价格记录为0
      });

      return MongoTeamSub.findByIdAndUpdate(sub._id, {
        $set: {
          currentExtraDatasetSize: datasetStoreAmount,
          nextExtraDatasetSize: datasetStoreAmount,
          status: sub.renew ? SubStatusEnum.active : SubStatusEnum.canceled, // renew=false 代表不再续费
          price: lastSubPrice // 上期的订阅价格记录为0
        }
      });
    })
  );
};

const addTeamDefaultSub = async () => {
  const allTeamId = await MongoTeam.find({}, '_id');
  console.log('total team', allTeamId.length);
  let success = 0;

  const addFreeSub = async (teamId: string): Promise<any> => {
    try {
      const sub = await MongoTeamSub.countDocuments({ teamId, type: SubTypeEnum.standard });
      if (sub > 0) {
        console.log(++success);
        return;
      }
      await createTeamFreeSubPlan({
        teamId
      });
    } catch (error) {
      console.log('add free sub error');
      console.log(error);
      await delay(1000);
      return addFreeSub(teamId);
    }
    console.log(++success);
  };

  for await (const { _id } of allTeamId) {
    await addFreeSub(_id);
  }

  return allTeamId.length;
};

const updateSubMode = async () => {
  const allSubs = await MongoTeamSub.find(
    {
      mode: { $exists: true },
      currentMode: { $exists: false }
    },
    '_id mode'
  );

  console.log('total team', allSubs.length);
  let success = 0;

  const updateSub = async (sub: any): Promise<any> => {
    try {
      await MongoTeamSub.findByIdAndUpdate(sub._id, {
        currentMode: sub.mode,
        nextMode: sub.mode
      });
    } catch (error) {
      console.log('update sub mode error');
      console.log(error);
      await delay(1000);
      return updateSub(sub);
    }
    console.log(++success);
  };

  for await (const sub of allSubs) {
    await updateSub(sub);
  }
  return allSubs.length;
};
