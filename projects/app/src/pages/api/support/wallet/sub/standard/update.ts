import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { StandardSubPlanParams } from '@fastgpt/global/support/wallet/sub/api';
import { MongoTeamSub } from '@fastgpt/service/support/wallet/sub/schema';
import { SubTypeEnum } from '@fastgpt/global/support/wallet/sub/constants';
import { authUserPer } from '@fastgpt/service/support/permission/user/auth';
import { calcStandardSubUpdateData } from './preCheck';
import { createStandardSubBill } from '@/service/support/wallet/sub/bill';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import { UserErrEnum } from '@fastgpt/global/common/error/code/user';
import { ManagePermissionVal } from '@fastgpt/global/support/permission/constant';

/* Update dataset size sub. */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // size: N 1000 group
  const { level, mode } = req.body as StandardSubPlanParams;

  try {
    await connectToDatabase();

    const { teamId, tmbId, tmb } = await authUserPer({
      req,
      authToken: true,
      per: ManagePermissionVal
    });

    // 计算需要补的差价(肯定是>=0) & 获取团队余额
    const {
      balanceEnough,
      payPrice,
      planPrice,
      planPointPrice,
      currentMode,
      nextMode,
      currentSubLevel,
      nextSubLevel,
      totalPoints,
      surplusPoints,
      planStartTime,
      planExpiredTime
    } = await calcStandardSubUpdateData({
      level,
      mode,
      teamId,
      teamBalance: tmb.balance
    });

    if (!balanceEnough) {
      throw new Error(UserErrEnum.balanceNotEnough);
    }

    await mongoSessionRun(async (session) => {
      // 更新订阅内容
      await MongoTeamSub.findOneAndUpdate(
        {
          teamId,
          type: SubTypeEnum.standard
        },
        {
          currentMode,
          nextMode,
          price: planPrice,
          pointPrice: planPointPrice,
          currentSubLevel,
          nextSubLevel,
          startTime: planStartTime,
          expiredTime: planExpiredTime,
          totalPoints,
          surplusPoints
        },
        { session }
      );

      // 检查是否需要创建余额
      if (payPrice !== undefined) {
        await createStandardSubBill({
          teamId,
          tmbId,
          payPrice,
          level,
          mode,
          session
        });
      }
    });

    jsonRes(res);
  } catch (err) {
    console.log(err);

    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
