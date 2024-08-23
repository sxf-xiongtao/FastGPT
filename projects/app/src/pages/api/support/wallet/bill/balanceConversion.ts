import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { authUserPer } from '@fastgpt/service/support/permission/user/auth';
import { OwnerPermissionVal } from '@fastgpt/global/support/permission/constant';
import { MongoTeam } from '@fastgpt/service/support/user/team/teamSchema';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import { MongoBill } from '@/service/support/wallet/bill/schema';
import {
  BillPayWayEnum,
  BillStatusEnum,
  BillTypeEnum,
  SUB_EXTRA_POINT_RATE
} from '@fastgpt/global/support/wallet/bill/constants';
import { getNanoid } from '@fastgpt/global/common/string/tools';
import { SubStatusEnum, SubTypeEnum } from '@fastgpt/global/support/wallet/sub/constants';
import { MongoTeamSub } from '@fastgpt/service/support/wallet/sub/schema';

import { addYears } from 'date-fns';
import { formatStorePrice2Read } from '@fastgpt/global/support/wallet/usage/tools';
export type BalanceConversionQuery = {};
export type BalanceConversionBody = {};
export type BalanceConversionResponse = {};

async function handler(
  req: ApiRequestProps<BalanceConversionBody, BalanceConversionQuery>,
  _res: ApiResponseType<any>
): Promise<BalanceConversionResponse> {
  const { teamId, tmbId } = await authUserPer({
    req,
    per: OwnerPermissionVal,
    authToken: true
  });

  const team = await MongoTeam.findById(teamId).lean();

  if (!team || team.balance <= 0) {
    return {};
  }

  const balance = team?.balance || 0;
  const readBalance = formatStorePrice2Read(balance);
  const pointPrice = global.subPlans?.extraPoints?.price || 0;

  // balance conversion: n/1000 points, expired 1 year
  const points = Math.ceil((readBalance / pointPrice) * SUB_EXTRA_POINT_RATE);
  if (points <= 0) {
    return {};
  }

  await mongoSessionRun(async (session) => {
    await MongoTeam.updateOne(
      { _id: teamId },
      {
        balance: 0
      },
      { session }
    );

    await MongoBill.create(
      [
        {
          teamId,
          tmbId,
          price: balance,
          status: BillStatusEnum.SUCCESS,
          type: BillTypeEnum.extraPoints,
          userId: team.ownerId, // only owner can do this
          orderId: getNanoid(24),
          hasInvoice: true,
          metadata: {
            month: 12,
            payWay: BillPayWayEnum.balance,
            extraPoints: points
          }
        }
      ],
      { session }
    );

    await MongoTeamSub.create(
      [
        {
          teamId,
          type: SubTypeEnum.extraPoints,
          status: SubStatusEnum.active,
          startTime: new Date(),
          expiredTime: addYears(new Date(), 1),
          price: balance,
          totalPoints: points,
          surplusPoints: points
        }
      ],
      { session }
    );
  });

  return {};
}

export default NextAPI(handler);
