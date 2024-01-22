/* 
    Gets the amount to be paid to modify the subscription
*/
import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import {
  SubDatasetSizeParams,
  SubDatasetSizePreviewCheckResponse
} from '@fastgpt/global/support/wallet/sub/api';
import { MongoTeamSub } from '@fastgpt/service/support/wallet/sub/schema';
import { calculateDaysBetweenDates } from '@fastgpt/global/common/math/date';
import { SubTypeEnum } from '@fastgpt/global/support/wallet/sub/constants';
import { PRICE_SCALE } from '@fastgpt/global/support/wallet/bill/constants';
import { authUserNotVisitor } from '@fastgpt/service/support/permission/auth/user';
import { TeamItemType } from '@fastgpt/global/support/user/team/type';
import { addDays } from 'date-fns';

/* Update dataset size sub. */

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // size: N 1000 group
  const { size } = req.body as SubDatasetSizeParams;

  try {
    await connectToDatabase();
    const { team } = await authUserNotVisitor({ req, authToken: true });

    jsonRes(res, {
      data: await calcDatasetSizeSubUpdateData({ size, team })
    });
  } catch (err) {
    console.log(err);

    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}

export const calcDatasetSizeSubUpdateData = async ({
  size,
  team
}: SubDatasetSizeParams & { team: TeamItemType }): Promise<SubDatasetSizePreviewCheckResponse> => {
  if (size < 0) {
    return Promise.reject('Size must be greater than 0');
  }

  // one month, 1000 group price
  const DatasetStorePrice = global.systemConfig?.subscription?.datasetStorePrice || 0;

  // find the sub
  const sub = await MongoTeamSub.findOne({
    teamId: team.teamId,
    type: SubTypeEnum.extraDatasetSize
  });

  const newSubSize = size * 1000;
  const alreadySubSize = sub?.currentExtraDatasetSize || 0;
  const alreadySubPrice = sub?.price || 0;
  const alreadySubDay = sub ? calculateDaysBetweenDates(sub.startTime, sub.expiredTime) : 0;

  // not add size, do not need to pay
  if (alreadySubSize >= newSubSize) {
    return {
      payForNewSub: false,
      balanceEnough: true,
      newSubSize,
      alreadySubSize,
      payPrice: 0,
      newPrice: 0,
      newSubStartTime: sub?.startTime || new Date(),
      newSubExpiredTime: sub?.expiredTime || new Date()
    };
  }

  // add size, new price - remain price
  // count remain cost
  // 1. cal remain days
  const remainDay = sub ? calculateDaysBetweenDates(new Date(), sub.expiredTime) : 0;
  // 2. cal remain price
  const remainPrice =
    alreadySubDay > 0 ? Math.floor((remainDay / alreadySubDay) * alreadySubPrice) : 0;
  // 3. cal new sub price
  const newPrice = DatasetStorePrice * size * PRICE_SCALE;
  // 4. cal total price
  const payPrice = newPrice - remainPrice;

  return {
    payForNewSub: true,
    balanceEnough: team.balance >= payPrice,
    newSubSize,
    alreadySubSize,
    payPrice: payPrice > 0 ? payPrice : 0,
    newPrice,
    // 订阅30天
    newSubStartTime: new Date(),
    newSubExpiredTime: addDays(new Date(), 30)
  };
};
